import { describe, expect, it } from "vitest";
import { avatarEyeClause, avatarPersonPhrase, normalizeAvatar } from "@/lib/avatar";

describe("avatar", () => {
  it("describes race and gender for the try-on photo", () => {
    expect(avatarPersonPhrase(normalizeAvatar({ gender: "man", skin: "black" }))).toBe("one adult Black man");
    expect(avatarPersonPhrase(normalizeAvatar({ gender: "woman", skin: "asian" }))).toBe("one adult East Asian woman");
  });
  it("rejects values outside the allowed lists", () => {
    const a = normalizeAvatar({ gender: "x", skin: "purple", hair: "no hair", eyes: "laser" });
    expect(a).toMatchObject({ gender: "woman", skin: null, hair: "no hair", eyes: null });
    expect(avatarEyeClause(normalizeAvatar({ eyes: "green" }))).toBe(" The person has green eyes.");
  });
});
