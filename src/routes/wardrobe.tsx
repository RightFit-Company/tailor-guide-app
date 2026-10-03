import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { streamImage } from "@/lib/stream-image";
import type { BodyCm } from "@/lib/fit";

const ClothesRail = lazy(() => import("@/components/clothes-rail"));
const BodyViewer = lazy(() => import("@/components/body-viewer"));

export const Route = createFileRoute("/wardrobe")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Wardrobe — RightFit" },
      { name: "description", content: "Scan your tops and trousers, let AI cut them out, and hang them on your own 3D clothes rail." },
      { property: "og:title", content: "My Wardrobe — RightFit" },
      { property: "og:description", content: "Your scanned clothes on a 3D rail — tap any item to try it on your 3D body." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WardrobePage,
});

type Item = { id: string; kind: "top" | "trousers"; description: string; color: string; image_path: string; url: string };

function loadBody(): BodyCm {
  try {
    const raw = JSON.parse(localStorage.getItem("rightfit.body.v1") ?? "{}") as Record<string, { value?: string; unit?: string } | string>;
    const cm = (k: string) => {
      const f = raw[k];
      const v = typeof f === "string" ? f : f?.value;
      const unit = typeof f === "string" ? "cm" : f?.unit;
      const n = parseFloat(v ?? "");
      return Number.isFinite(n) && n > 0 ? (unit === "in" ? n * 2.54 : n) : undefined;
    };
    return { chest: cm("chest"), waist: cm("waist"), hips: cm("hips") };
  } catch {
    return {};
  }
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Shrink big phone photos before sending them to the AI. */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.88));
}

const card = "rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-hard)]";
const btn = "rounded-full border-2 border-ink px-5 py-2.5 font-display font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50";

function AuthCard() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/wardrobe` } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Check your email to confirm your account, then sign in.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/wardrobe` });
    if (r.error) setMsg(r.error.message);
  }

  return (
    <div className={`${card} mx-auto max-w-md p-6`}>
      <h2 className="font-display text-2xl font-bold">{mode === "in" ? "Sign in to your wardrobe" : "Create your wardrobe"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your clothes are saved to your account so they follow you to any device.</p>
      <button type="button" onClick={google} className={`${btn} mt-5 w-full bg-card`}>
        Continue with Google
      </button>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className={`${btn} w-full bg-brand text-primary-foreground`}>
          {busy ? "One sec…" : mode === "in" ? "Sign in" : "Sign up"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm font-medium">{msg}</p>}
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm underline">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function WardrobePage() {
  const { user, session, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState<null | "reading" | "cutting" | "saving">(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tryOn, setTryOn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from("wardrobe_items").select("*").order("created_at");
    if (e) return setError(e.message);
    const rows = data ?? [];
    const signed = rows.length
      ? (await supabase.storage.from("wardrobe").createSignedUrls(rows.map((r) => r.image_path), 3600)).data ?? []
      : [];
    setItems(rows.map((r, i) => ({ ...r, kind: r.kind === "trousers" ? "trousers" : "top", url: signed[i]?.signedUrl ?? "" })));
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function scan(file: File) {
    if (!session || !user) return;
    setError(null);
    setPreview(null);
    try {
      const small = await shrink(file);
      const auth = { Authorization: `Bearer ${session.access_token}` };
      setStage("reading");
      const aRes = await fetch("/api/wardrobe/analyze", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ image: await fileToDataUrl(small) }),
      });
      if (!aRes.ok) throw new Error((await aRes.text()) || "Couldn't read that photo");
      const info = (await aRes.json()) as { kind: "top" | "trousers"; description: string; color: string };

      setStage("cutting");
      const form = new FormData();
      form.append("image", new File([small], "item.jpg", { type: "image/jpeg" }));
      let final: string | null = null;
      await streamImage("/api/wardrobe/cutout", form, (src, isFinal) => {
        setPreview(src);
        if (isFinal) final = src;
      }, undefined, auth);
      if (!final) throw new Error("The cut-out didn't finish. Please try again.");

      setStage("saving");
      const blob = await (await fetch(final)).blob();
      const path = `${user.id}/${crypto.randomUUID()}.png`;
      const up = await supabase.storage.from("wardrobe").upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      const ins = await supabase.from("wardrobe_items").insert({ ...info, image_path: path }).select().single();
      if (ins.error) throw ins.error;
      await load();
      setSelected(ins.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStage(null);
      setPreview(null);
    }
  }

  async function remove(item: Item) {
    await supabase.storage.from("wardrobe").remove([item.image_path]);
    await supabase.from("wardrobe_items").delete().eq("id", item.id);
    setSelected(null);
    setTryOn(false);
    await load();
  }

  const sel = items.find((i) => i.id === selected) ?? null;
  const body = loadBody();

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display text-sm font-semibold underline">← Back to fit checker</Link>
          {user && (
            <button onClick={() => supabase.auth.signOut()} className="text-sm underline">Sign out</button>
          )}
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">My Wardrobe</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Snap a photo of a t-shirt, top or trousers. AI cuts it out, works out what it is, and hangs it on your rail.
        </p>

        {loading ? null : !user ? (
          <div className="mt-8"><AuthCard /></div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void scan(f);
              }} />
              <button disabled={!!stage} onClick={() => fileRef.current?.click()} className={`${btn} bg-brand text-primary-foreground`}>
                {stage === "reading" ? "Reading your item…" : stage === "cutting" ? "Cutting it out…" : stage === "saving" ? "Hanging it up…" : "📷 Scan a clothing item"}
              </button>
              <span className="text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
            </div>
            {error && <p className={`${card} mt-4 bg-sun p-3 text-sm font-medium text-ink`}>{error}</p>}
            {preview && (
              <img src={preview} alt="Cut-out in progress" className={`${card} mt-4 h-48 w-48 object-contain p-2 transition-[filter] ${stage === "cutting" ? "blur-md" : "blur-0"}`} />
            )}

            <div className={`${card} mt-6 h-[420px] overflow-hidden sm:h-[480px]`}>
              {items.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
                  Your rail is empty — scan your first item to hang it up.
                </div>
              ) : (
                <Suspense fallback={<div className="p-6">Loading rail…</div>}>
                  <ClothesRail items={items} selectedId={selected} onSelect={(id) => { setSelected(id); setTryOn(false); }} />
                </Suspense>
              )}
            </div>
            {items.length > 0 && !sel && <p className="mt-3 text-sm text-muted-foreground">Tap an item on the rail to pick it. Drag to spin around.</p>}

            {sel && (
              <div className={`${card} mt-6 p-5`}>
                <div className="flex flex-wrap items-center gap-4">
                  <img src={sel.url} alt={sel.description} className="h-20 w-20 object-contain" />
                  <div className="flex-1">
                    <p className="font-display text-xl font-bold capitalize">{sel.description}</p>
                    <p className="text-sm text-muted-foreground">{sel.kind === "top" ? "Top" : "Trousers"}</p>
                  </div>
                  <button onClick={() => setTryOn((t) => !t)} className={`${btn} bg-mint text-primary-foreground`}>
                    {tryOn ? "Hide try-on" : "Try it on"}
                  </button>
                  <button onClick={() => remove(sel)} className={`${btn} bg-card`}>Remove</button>
                </div>
                {tryOn && (
                  <>
                    {!body.chest && !body.waist && (
                      <p className="mt-4 text-sm">Tip: enter your measurements on the fit checker first so the model matches your shape.</p>
                    )}
                    <div className="mt-4 h-[460px] overflow-hidden rounded-xl border-2 border-ink">
                      <Suspense fallback={<div className="p-6">Loading model…</div>}>
                        <BodyViewer body={body} garment={{}} type={sel.kind} color={sel.color} />
                      </Suspense>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
