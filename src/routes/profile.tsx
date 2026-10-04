import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, LogOut, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAvatar } from "@/hooks/use-avatar";
import { EYE_OPTIONS, HAIR_OPTIONS, SKIN_OPTIONS, type Avatar } from "@/lib/avatar";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Profile — RightFit" },
      { name: "description", content: "Set your profile picture, your try-on avatar and your body measurements." },
      { property: "og:title", content: "My Profile — RightFit" },
      { property: "og:description", content: "Your RightFit avatar, picture and measurements in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Field = { value: string; unit: "cm" | "in" };
const FIELDS = [
  { key: "height", label: "Height" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "leg", label: "Leg length (inside leg)" },
] as const;
type FieldKey = (typeof FIELDS)[number]["key"];
const emptyBody = (): Record<FieldKey, Field> => ({
  height: { value: "", unit: "cm" }, chest: { value: "", unit: "cm" }, waist: { value: "", unit: "cm" }, hips: { value: "", unit: "cm" }, leg: { value: "", unit: "cm" },
});
function toField(raw: unknown): Field {
  if (raw && typeof raw === "object") {
    const r = raw as { value?: unknown; unit?: unknown };
    return { value: typeof r.value === "string" ? r.value : r.value != null ? String(r.value) : "", unit: r.unit === "in" ? "in" : "cm" };
  }
  if (typeof raw === "string" || typeof raw === "number") return { value: String(raw), unit: "cm" };
  return { value: "", unit: "cm" };
}

const card = "rounded-2xl border-2 border-ink bg-card p-4 shadow-[var(--shadow-hard)] sm:p-6";
const chip = "min-h-10 rounded-full border-2 border-ink px-4 py-2 font-display font-semibold capitalize shadow-[2px_2px_0_0_var(--ink)]";

function Choice<T extends string>({ label, options, value, onChange, optional }: { label: string; options: readonly T[]; value: T | null; onChange: (v: T | null) => void; optional?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{label}{optional && <span className="font-medium normal-case"> (optional — tap again to clear)</span>}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <Button key={o} type="button" variant="outline" aria-pressed={value === o} onClick={() => onChange(optional && value === o ? null : o)} className={`${chip} h-auto ${value === o ? "bg-sun text-ink" : "bg-card"}`}>{o}</Button>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, session, loading } = useAuth();
  const { avatar: saved, photoUrl, ready, reload } = useAvatar(user);
  const [avatar, setAvatar] = useState<Avatar>(saved);
  const [body, setBody] = useState(emptyBody);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { if (ready) setAvatar(saved); }, [ready, saved]);
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("body_profiles").select("body").eq("user_id", user.id).maybeSingle();
      let raw = (data?.body ?? {}) as Record<string, unknown>;
      if (Object.keys(raw).length === 0) {
        try { raw = JSON.parse(localStorage.getItem("rightfit.body.v1") ?? "{}"); } catch { raw = {}; }
      }
      const next = emptyBody();
      for (const { key } of FIELDS) next[key] = toField(raw[key]);
      setBody(next);
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-paper" />;
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper p-4 text-ink">
        <div className={`${card} max-w-sm text-center`}>
          <p className="font-display text-2xl font-bold">Sign in to see your profile</p>
          <Link to="/wardrobe" className="mt-4 inline-block rounded-full border-2 border-ink bg-ink px-5 py-2.5 font-display font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </div>
    );
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("body_profiles").upsert({ user_id: user.id, avatar: { ...avatar }, body, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("Couldn't save your profile — please try again.");
    try {
      const local = JSON.parse(localStorage.getItem("rightfit.body.v1") ?? "{}");
      localStorage.setItem("rightfit.body.v1", JSON.stringify({ ...local, ...body }));
      const profile = JSON.parse(localStorage.getItem("rightfit.profile.v1") ?? "{}");
      localStorage.setItem("rightfit.profile.v1", JSON.stringify({ ...profile, bodyType: avatar.gender }));
    } catch { /* ignore */ }
    toast.success("Profile saved.");
    void reload();
  }

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose a photo.");
    if (file.size > 5 * 1024 * 1024) { toast.error("That photo is over 5 MB.");
    setUploading(true);
    const path = `${user.id}/profile-${crypto.randomUUID()}.${file.type.split("/")[1] ?? "jpg"}`;
    const up = await supabase.storage.from("wardrobe").upload(path, file, { contentType: file.type });
    if (up.error) { setUploading(false); { toast.error("Couldn't upload that photo."); return; }
    if (saved.photoPath) await supabase.storage.from("wardrobe").remove([saved.photoPath]);
    const next = { ...saved, photoPath: path };
    await supabase.from("body_profiles").upsert({ user_id: user.id, avatar: { ...next }, updated_at: new Date().toISOString() });
    setAvatar((a) => ({ ...a, photoPath: path }));
    setUploading(false);
    toast.success("Profile picture updated.");
    void reload();
  }

  async function deleteAccount() {
    if (!session) return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!res.ok) { setDeleting(false); { toast.error((await res.text()) || "Couldn't delete your account."); return; }
    localStorage.removeItem("rightfit.body.v1");
    localStorage.removeItem("rightfit.profile.v1");
    await supabase.auth.signOut();
    toast.success("Your account has been deleted.");
    void navigate({ to: "/" });
  }

  const initial = (user.email?.[0] ?? "R").toUpperCase();

  return (
    <div className="min-h-screen bg-paper px-3 py-4 font-sans text-ink sm:px-6 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="font-display text-xl font-bold">← RightFit</Link>
          <Link to="/wardrobe" className="rounded-xl border-2 border-ink bg-sun px-3 py-2 font-display text-sm font-semibold shadow-hard-xs">My Wardrobe</Link>
        </div>

        <section className={card}>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Change profile picture" className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-mint font-display text-3xl font-bold sm:size-24">
              {photoUrl ? <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" /> : initial}
              <span className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full border-2 border-ink bg-card"><Camera className="size-4" aria-hidden="true" /></span>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold">My profile</h1>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <Button type="button" variant="link" disabled={uploading} onClick={() => fileRef.current?.click()} className="h-auto p-0 text-sm font-bold text-foreground underline">{uploading ? "Uploading…" : "Change profile picture"}</Button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadPhoto(f); }} />
        </section>

        <section className={`${card} space-y-4`}>
          <div>
            <h2 className="font-display text-xl font-bold">Your try-on avatar</h2>
            <p className="text-sm text-muted-foreground">AI outfit photos in your wardrobe will look like this person.</p>
          </div>
          <Choice label="Gender" options={["woman", "man"] as const} value={avatar.gender} onChange={(g) => g && setAvatar((a) => ({ ...a, gender: g }))} />
          <Choice label="Race" options={SKIN_OPTIONS} value={avatar.skin} optional onChange={(skin) => setAvatar((a) => ({ ...a, skin }))} />
          <Choice label="Hair" options={HAIR_OPTIONS} value={avatar.hair as (typeof HAIR_OPTIONS)[number] | null} optional onChange={(hair) => setAvatar((a) => ({ ...a, hair }))} />
          <Choice label="Eye colour" options={EYE_OPTIONS} value={avatar.eyes as (typeof EYE_OPTIONS)[number] | null} optional onChange={(eyes) => setAvatar((a) => ({ ...a, eyes }))} />
        </section>

        <section className={`${card} space-y-3`}>
          <h2 className="font-display text-xl font-bold">Your measurements</h2>
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase text-muted-foreground">{label}</span>
                <input type="number" inputMode="decimal" min={0} value={body[key].value} onChange={(e) => setBody((b) => ({ ...b, [key]: { ...b[key], value: e.target.value } }))} className="w-full rounded-xl border-2 border-ink bg-background px-4 py-2.5" />
              </label>
              <div className="flex rounded-xl border-2 border-ink p-0.5" role="group" aria-label={`${label} unit`}>
                {(["cm", "in"] as const).map((u) => (
                  <button key={u} type="button" aria-pressed={body[key].unit === u} onClick={() => setBody((b) => ({ ...b, [key]: { ...b[key], unit: u } }))} className={`min-h-10 rounded-lg px-3 font-display text-sm font-semibold ${body[key].unit === u ? "bg-ink text-primary-foreground" : ""}`}>{u}</button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <Button type="button" disabled={saving} onClick={() => void save()} className="h-auto min-h-12 w-full rounded-full border-2 border-ink bg-brand font-display text-base font-semibold text-primary-foreground shadow-[3px_3px_0_0_var(--ink)]">{saving ? "Saving…" : "Save profile"}</Button>

        <section className={`${card} space-y-3`}>
          <Button type="button" variant="outline" onClick={async () => { await supabase.auth.signOut(); void navigate({ to: "/" }); }} className="h-auto min-h-11 w-full rounded-full border-2 border-ink bg-card font-display font-semibold"><LogOut aria-hidden="true" />Sign out</Button>
          {!confirmDelete ? (
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} className="h-auto min-h-11 w-full rounded-full border-2 border-ink bg-card font-display font-semibold text-destructive"><Trash2 aria-hidden="true" />Delete my account</Button>
          ) : (
            <div className="rounded-xl border-2 border-ink bg-sun p-3">
              <p className="font-display font-bold">Delete your account for good?</p>
              <p className="text-sm">Your wardrobe, photos, avatar and measurements will be removed. This can't be undone.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)} className="h-auto min-h-11 rounded-full border-2 border-ink bg-card font-semibold">Keep it</Button>
                <Button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="h-auto min-h-11 rounded-full border-2 border-ink bg-destructive font-semibold text-destructive-foreground">{deleting ? "Deleting…" : "Yes, delete"}</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
