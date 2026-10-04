import { describe, expect, it } from "vitest";
import { outfitHairClause, WARDROBE_CUTOUT_PROMPT } from "@/lib/wardrobe-prompts";

describe("wardrobe cut-out orientation", () => {
  it("requires tops and trousers to be saved upright", () => {
    expect(WARDROBE_CUTOUT_PROMPT).toContain("Always rotate the garment into its natural upright orientation");
    expect(WARDROBE_CUTOUT_PROMPT).toContain("neckline and shoulders at the top");
    expect(WARDROBE_CUTOUT_PROMPT).toContain("waistband at the top");
  });
});

describe("outfit hair choice", () => {
  it("asks for a hairless head when no hair is selected", () => {
    expect(outfitHairClause("no hair")).toBe(" The person has a shaved, hairless head.");
  });
});