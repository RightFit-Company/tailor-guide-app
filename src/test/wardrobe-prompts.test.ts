import { describe, expect, it } from "vitest";
import { WARDROBE_CUTOUT_PROMPT } from "@/lib/wardrobe-prompts";

describe("wardrobe cut-out orientation", () => {
  it("requires tops and trousers to be saved upright", () => {
    expect(WARDROBE_CUTOUT_PROMPT).toContain("Always rotate the garment into its natural upright orientation");
    expect(WARDROBE_CUTOUT_PROMPT).toContain("neckline and shoulders at the top");
    expect(WARDROBE_CUTOUT_PROMPT).toContain("waistband at the top");
  });
});