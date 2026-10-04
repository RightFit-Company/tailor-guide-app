export type AvatarGender = "woman" | "man";
export const SKIN_OPTIONS = ["asian", "black", "white", "brown"] as const;
export const HAIR_OPTIONS = ["no hair", "black", "brown", "blonde", "red", "grey"] as const;
export const EYE_OPTIONS = ["brown", "blue", "green", "hazel", "grey"] as const;
export type Skin = (typeof SKIN_OPTIONS)[number];

export interface Avatar {
  gender: AvatarGender;
  skin: Skin | null;
  hair: string | null;
  eyes: string | null;
  /** Profile picture path in the private wardrobe bucket. */
  photoPath?: string | null;
}

export const DEFAULT_AVATAR: Avatar = { gender: "woman", skin: null, hair: null, eyes: null, photoPath: null };

const pick = <T extends string>(list: readonly T[], v: unknown): T | null =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : null;

/** Coerce any stored/posted value into a safe avatar (allow-listed values only). */
export function normalizeAvatar(raw: unknown): Avatar {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    gender: r["gender"] === "man" ? "man" : "woman",
    skin: pick(SKIN_OPTIONS, r["skin"]),
    hair: pick(HAIR_OPTIONS, r["hair"]),
    eyes: pick(EYE_OPTIONS, r["eyes"]),
    photoPath: typeof r["photoPath"] === "string" ? r["photoPath"] : null,
  };
}

const SKIN_WORDS: Record<Skin, string> = {
  asian: "East Asian",
  black: "Black",
  white: "white",
  brown: "brown-skinned South Asian",
};

/** Describes the person for the outfit photo prompt, e.g. "an adult Black man". */
export function avatarPersonPhrase(a: Avatar): string {
  return `one adult ${a.skin ? `${SKIN_WORDS[a.skin]} ` : ""}${a.gender}`;
}

export function avatarEyeClause(a: Avatar): string {
  return a.eyes ? ` The person has ${a.eyes} eyes.` : "";
}
