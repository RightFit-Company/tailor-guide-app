import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AVATAR, normalizeAvatar, type Avatar } from "@/lib/avatar";

/** Loads the signed-in user's avatar settings and a signed URL for their profile picture. */
export function useAvatar(user: User | null) {
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("body_profiles").select("avatar").eq("user_id", user.id).maybeSingle();
    const a = normalizeAvatar(data?.avatar);
    setAvatar(a);
    if (a.photoPath) {
      const { data: s } = await supabase.storage.from("wardrobe").createSignedUrl(a.photoPath, 3600);
      setPhotoUrl(s?.signedUrl ?? null);
    } else setPhotoUrl(null);
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAvatar(DEFAULT_AVATAR);
      setPhotoUrl(null);
      setReady(false);
      return;
    }
    void reload();
  }, [user, reload]);

  return { avatar, photoUrl, ready, reload };
}
