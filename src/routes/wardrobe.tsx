import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ImagePlus, LogOut, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ClothesRail from "@/components/clothes-rail";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { streamImage } from "@/lib/stream-image";
import { useAvatar } from "@/hooks/use-avatar";

export const Route = createFileRoute("/wardrobe")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Wardrobe — RightFit" },
      { name: "description", content: "Scan your tops, dresses, skirts, coats, trousers and shorts, build outfits, and create realistic photos of people wearing your clothes." },
      { property: "og:title", content: "My Wardrobe — RightFit" },
      { property: "og:description", content: "A private 2D catalog for your scanned clothes, with realistic AI outfit photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WardrobePage,
});

import { KINDS, SLOTS, slotOf, toggleItem, type Kind, type Slot } from "@/lib/outfit-rules";
type Item = { id: string; kind: Kind; description: string; color: string; image_path: string; url: string };
const STYLES = [
  { value: "casual", label: "Casual", emoji: "👕" },
  { value: "smart casual", label: "Smart casual", emoji: "🧥" },
  { value: "formal", label: "Formal", emoji: "👔" },
  { value: "sporty", label: "Sporty", emoji: "🏃" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "cosy", label: "Cosy", emoji: "☕" },
] as const;

/** Rough body size in cm from the saved measurements, for the AI photo only. */
function loadBodyCm(): { height?: number; chest?: number; waist?: number; hips?: number } {
  try {
    const raw = JSON.parse(localStorage.getItem("rightfit.body.v1") ?? "{}") as Record<string, { value?: string; unit?: string } | undefined>;
    const out: Record<string, number> = {};
    for (const key of ["height", "chest", "waist", "hips"]) {
      const f = raw[key];
      const n = parseFloat(f?.value ?? "");
      if (n > 0) out[key] = Math.round(f?.unit === "in" ? n * 2.54 : n);
    }
    return out;
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
  const context = c.getContext("2d");
  if (!context) throw new Error("This photo could not be prepared");
  context.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) => c.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This photo could not be prepared")), "image/jpeg", 0.88));
}

const card = "rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-hard)]";
const btn = "min-h-11 rounded-full border-2 border-ink px-4 py-2.5 font-display font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 sm:px-5";

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
    <div className={`${card} mx-auto max-w-md p-4 sm:p-6`}>
      <h2 className="font-display text-2xl font-bold">{mode === "in" ? "Sign in to your wardrobe" : "Create your wardrobe"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your clothes are saved to your account so they follow you to any device.</p>
      <Button type="button" variant="outline" onClick={google} className={`${btn} mt-5 h-auto w-full bg-card`}>
        Continue with Google
      </Button>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button disabled={busy} className={`${btn} h-auto w-full bg-brand text-primary-foreground`}>
          {busy ? "One sec…" : mode === "in" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      {msg && <p className="mt-3 text-sm font-medium">{msg}</p>}
      <Button type="button" variant="link" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 h-auto p-0 text-sm text-foreground underline">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </Button>
    </div>
  );
}

function WardrobePage() {
  const { user, session, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [style, setStyle] = useState<(typeof STYLES)[number]["value"] | null>(null);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [selection, setSelection] = useState<Partial<Record<Slot, string>>>({});
  const [stage, setStage] = useState<null | "reading" | "cutting" | "saving">(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outfitPhoto, setOutfitPhoto] = useState<string | null>(null);
  const [outfitPhotoFinal, setOutfitPhotoFinal] = useState(false);
  const [makingOutfit, setMakingOutfit] = useState(false);
  const { avatar } = useAvatar(user);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from("wardrobe_items").select("*").order("created_at");
    if (e) return setError(e.message);
    const rows = data ?? [];
    const signed = rows.length
      ? (await supabase.storage.from("wardrobe").createSignedUrls(rows.map((r) => r.image_path), 3600)).data ?? []
      : [];
    setItems(rows.map((r, i) => ({ ...r, kind: (KINDS as string[]).includes(r.kind) ? (r.kind as Kind) : "top", url: signed[i]?.signedUrl ?? "" })));
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
      const info = (await aRes.json()) as { kind: Kind; description: string; color: string };

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
      setSelection((cur) => toggleItem(cur, ins.data.id, info.kind, (otherId) => items.find((i) => i.id === otherId)?.kind));
      setOutfitPhoto(null);
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
    setSelection((cur) => { const next = { ...cur }; const sl = slotOf(item.kind); if (next[sl] === item.id) delete next[sl]; return next; });
    await load();
  }

  const visibleItems = items.filter((i) => (kindFilter === "all" || i.kind === kindFilter) && i.description.toLowerCase().includes(query.trim().toLowerCase()));
  const outfit = SLOTS.map(({ slot }) => items.find((item) => item.id === selection[slot]) ?? null);
  const chosen = outfit.filter((item): item is Item => item != null);

  function selectItem(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;
    setSelection((cur) => toggleItem(cur, id, item.kind, (otherId) => items.find((i) => i.id === otherId)?.kind));
    setOutfitPhoto(null);
    setOutfitPhotoFinal(false);
  }

  async function surpriseMe() {
    if (!session || !style || items.length === 0) return;
    setError(null);
    setPicking(true);
    try {
      const res = await fetch("/api/wardrobe/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ style, items: items.map(({ id, kind, description }) => ({ id, kind, description })) }),
      });
      if (!res.ok) throw new Error((await res.text()) || "The AI couldn't pick an outfit");
      const { ids } = (await res.json()) as { ids: string[] };
      let next: Partial<Record<Slot, string>> = {};
      for (const id of ids) {
        const item = items.find((i) => i.id === id);
        if (item && !next[slotOf(item.kind)]) next = toggleItem(next, id, item.kind, (otherId) => items.find((i) => i.id === otherId)?.kind);
      }
      setSelection(next);
      const picked = SLOTS.map(({ slot }) => items.find((i) => i.id === next[slot])).filter((i): i is Item => !!i);
      setPicking(false);
      setTimeout(() => document.getElementById("outfit-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      await makeOutfitPhoto(picked);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The AI couldn't pick an outfit");
    } finally {
      setPicking(false);
    }
  }

  async function makeOutfitPhoto(selected: Item[] = chosen) {
    if (!session || selected.length === 0) return;
    setError(null);
    setOutfitPhoto(null);
    setOutfitPhotoFinal(false);
    setMakingOutfit(true);
    try {
      const form = new FormData();
      for (const item of selected) {
        const response = await fetch(item.url);
        if (!response.ok) throw new Error("One of your clothing photos could not be loaded");
        const blob = await response.blob();
        form.append("image[]", new File([blob], `${item.kind}.png`, { type: blob.type || "image/png" }));
        form.append("description", `${item.kind}: ${item.description}`);
      }
      form.set("presentation", avatar.gender);
      if (avatar.hair) form.set("hairColor", avatar.hair);
      if (avatar.skin) form.set("skin", avatar.skin);
      if (avatar.eyes) form.set("eyes", avatar.eyes);
      const bodyCm = loadBodyCm();
      for (const [key, value] of Object.entries(bodyCm)) form.set(key, String(value));
      await streamImage(
        "/api/wardrobe/outfit",
        form,
        (src, isFinal) => {
          setOutfitPhoto(src);
          setOutfitPhotoFinal(isFinal);
        },
        undefined,
        { Authorization: `Bearer ${session.access_token}` },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The outfit photo could not be made");
    } finally {
      setMakingOutfit(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="font-display text-sm font-semibold underline">← Back to fit checker</Link>
          {user && (
            <Button type="button" variant="link" onClick={() => supabase.auth.signOut()} className="h-auto p-0 text-sm text-foreground underline"><LogOut aria-hidden="true" />Sign out</Button>
          )}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-5xl">My Wardrobe</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Scan your clothes, pick a hat, top, bottoms, belt, socks and shoes from your catalog, then create a realistic photo of someone wearing the outfit.
        </p>

        {loading ? null : !user ? (
          <div className="mt-8"><AuthCard /></div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void scan(f);
              }} />
              <Button disabled={!!stage} onClick={() => fileRef.current?.click()} className={`${btn} h-auto w-full bg-brand text-primary-foreground sm:w-auto`}>
                <Camera aria-hidden="true" />
                {stage === "reading" ? "Reading your item…" : stage === "cutting" ? "Cutting it out…" : stage === "saving" ? "Adding it…" : "Scan a clothing item"}
              </Button>
              <span className="text-center text-sm text-muted-foreground sm:text-left">{items.length} item{items.length === 1 ? "" : "s"}</span>
            </div>
            {error && <p className={`${card} mt-4 bg-sun p-3 text-sm font-medium text-ink`}>{error}</p>}
            {preview && (
              <img src={preview} alt="Cut-out in progress" className={`${card} mt-4 h-48 w-48 object-contain p-2 transition-[filter] ${stage === "cutting" ? "blur-md" : "blur-0"}`} />
            )}

            <section className={`${card} mt-6 p-3 sm:p-6`} aria-labelledby="catalog-heading">
              <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:mb-5">
                <div className="min-w-0">
                  <h2 id="catalog-heading" className="font-display text-2xl font-bold">Your clothes</h2>
                  <p className="text-sm text-muted-foreground">Tap clothes to build an outfit — a coat or blazer can go over your top.</p>
                </div>
                {chosen.length > 0 && <span className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-bold">{chosen.length} selected</span>}
              </div>
              {items.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center border-2 border-dashed border-ink/30 p-6 text-center text-muted-foreground">
                  <ImagePlus className="mb-3 h-9 w-9" aria-hidden="true" />
                  Your catalog is empty — scan your first item to add it.
                </div>
              ) : (
                <>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your clothes…" aria-label="Search your clothes" className="mb-3 w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" />
                  <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by type">
                    {(["all", ...KINDS.filter((k) => items.some((i) => i.kind === k))] as const).map((k) => (
                      <Button key={k} type="button" variant="outline" aria-pressed={kindFilter === k} onClick={() => setKindFilter(k)} className={`h-auto min-h-10 shrink-0 rounded-full border-2 border-ink px-4 py-2 font-display font-semibold capitalize shadow-[2px_2px_0_0_var(--ink)] ${kindFilter === k ? "bg-sun text-ink" : "bg-card"}`}>
                        {k === "all" ? "All" : k} <span className="text-xs opacity-60">{k === "all" ? items.length : items.filter((i) => i.kind === k).length}</span>
                      </Button>
                    ))}
                  </div>
                  {visibleItems.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No clothes match that.</p> : <ClothesRail items={visibleItems} selectedIds={chosen.map((item) => item.id)} onSelect={selectItem} />}
                </>
              )}
            </section>

            {items.length > 0 && (
              <section className={`${card} mt-6 bg-mint p-4 sm:p-5`} aria-labelledby="surprise-heading">
                <h2 id="surprise-heading" className="font-display text-2xl font-bold">✨ Surprise me</h2>
                <p className="text-sm text-ink/80">Pick a vibe and the AI will put an outfit together from your wardrobe, then make a photo of it.</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Outfit style">
                  {STYLES.map((s) => (
                    <Button key={s.value} type="button" variant="outline" onClick={() => setStyle(s.value)} aria-pressed={style === s.value} className={`${btn} h-auto min-h-11 px-3 py-2 ${style === s.value ? "bg-ink text-background" : "bg-card"}`}>
                      <span aria-hidden="true">{s.emoji}</span>{s.label}
                    </Button>
                  ))}
                </div>
                <Button type="button" disabled={!style || picking || makingOutfit} onClick={() => void surpriseMe()} className={`${btn} mt-3 h-auto w-full bg-brand text-primary-foreground sm:w-auto`}>
                  <Sparkles aria-hidden="true" />{picking ? "Picking your outfit…" : makingOutfit ? "Creating your photo…" : style ? "Put an outfit together" : "Choose a style first"}
                </Button>
              </section>
            )}

            {chosen.length > 0 && (
              <div id="outfit-panel" className={`${card} mt-6 scroll-mt-4 p-4 sm:p-5`}>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-bold">Your outfit</p>
                    <p className="text-sm text-muted-foreground">Choose up to one of each from your catalog. Tap it again to deselect it.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => { setSelection({}); setOutfitPhoto(null); }} className={`${btn} h-auto w-full bg-card sm:w-auto`}><X aria-hidden="true" />Clear outfit</Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {outfit.map((item, index) => (
                    <div key={SLOTS[index]!.slot} className="grid min-h-24 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border-2 border-ink bg-background p-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                      {item ? <img src={item.url} alt={item.description} className="h-18 w-18 object-contain sm:h-20 sm:w-20" /> : <div className="flex h-18 w-18 items-center justify-center border-2 border-dashed border-ink/30 text-2xl sm:h-20 sm:w-20">{SLOTS[index]!.emoji}</div>}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase text-muted-foreground">{SLOTS[index]!.label}</p>
                         <p className="truncate font-display text-lg font-bold capitalize">{item?.description ?? "Pick from your catalog"}</p>
                        {item && <Button type="button" variant="link" onClick={() => void remove(item)} className="mt-1 h-auto p-0 text-xs font-bold text-foreground underline"><Trash2 aria-hidden="true" />Remove</Button>}
                      </div>
                    </div>
                  ))}
                </div>
                 <div className="mt-5 grid gap-3 border-t-2 border-ink pt-5">
                  <p className="text-sm text-muted-foreground">The person in the photo uses your avatar: <span className="font-bold capitalize text-foreground">{[avatar.skin, avatar.gender, avatar.hair && (avatar.hair === "no hair" ? "no hair" : `${avatar.hair} hair`), avatar.eyes && `${avatar.eyes} eyes`].filter(Boolean).join(", ")}</span>. <Link to="/profile" className="font-bold text-foreground underline">Change avatar</Link></p>
                  <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                  <Button type="button" disabled={makingOutfit} onClick={() => void makeOutfitPhoto()} className={`${btn} h-auto w-full whitespace-normal bg-blue text-center text-primary-foreground sm:w-auto sm:whitespace-nowrap`}>
                    <Sparkles aria-hidden="true" />{makingOutfit ? "Creating your outfit photo…" : outfitPhotoFinal ? "Create another photo" : "Create outfit photo"}
                  </Button>
                  <p className="max-w-lg text-xs text-muted-foreground">AI creates a new fashion photo using your selected clothes as references, with a body shape roughly based on your saved measurements. Small details may vary.</p>
                  <p className="w-full rounded-lg border-2 border-ink bg-sun px-3 py-2 text-xs font-bold text-ink"><span className="mr-2 rounded-full border-2 border-ink bg-card px-2 py-0.5 uppercase">Beta</span>Matching your body shape is in beta — the photo is only a rough guide, not an exact likeness.</p>
                  </div>
                </div>
                {(makingOutfit || outfitPhoto) && (
                  <div className="mt-5 overflow-hidden rounded-lg border-2 border-ink bg-muted">
                    {outfitPhoto ? (
                      <img
                        src={outfitPhoto}
                        alt={`AI-created person wearing ${chosen.map((item) => item.description).join(", ")}`}
                        className={`mx-auto block max-h-[760px] w-auto max-w-full object-contain transition-[filter] ${outfitPhotoFinal ? "blur-0" : "blur-2xl"}`}
                      />
                    ) : (
                      <div className="flex aspect-[2/3] max-h-[760px] w-full flex-col items-center justify-center bg-muted p-8 text-center">
                        <Sparkles className="mb-3 h-10 w-10 animate-pulse text-brand" aria-hidden="true" />
                        <p className="font-display text-xl font-bold">Styling your outfit…</p>
                        <p className="mt-1 text-sm text-muted-foreground">Your photo can take a little while.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
