import { describe, expect, it } from "vitest";
import { avatarProportions } from "@/lib/avatar";

describe("avatarProportions", () => {
  it("uses the entered height and inside leg", () => {
    const avatar = avatarProportions({ height: 180, chest: 100, waist: 82, hips: 98, inseam: 84 }, "man");
    expect(avatar.height).toBe(1.8);
    expect(avatar.inseam).toBe(0.84);
  });

  it("makes larger tape measurements visibly wider", () => {
    const smaller = avatarProportions({ height: 170, chest: 86, waist: 68, hips: 90 }, "woman", "B");
    const larger = avatarProportions({ height: 170, chest: 108, waist: 92, hips: 116 }, "woman", "B");
    expect(larger.chestWidth).toBeGreaterThan(smaller.chestWidth);
    expect(larger.waistWidth).toBeGreaterThan(smaller.waistWidth);
    expect(larger.hipWidth).toBeGreaterThan(smaller.hipWidth);
  });

  it("uses cup size to add bust depth without changing body height", () => {
    const a = avatarProportions({ height: 165, chest: 92, waist: 74, hips: 98 }, "woman", "A");
    const f = avatarProportions({ height: 165, chest: 92, waist: 74, hips: 98 }, "woman", "F");
    expect(f.chestDepth).toBeGreaterThan(a.chestDepth);
    expect(f.height).toBe(a.height);
  });
});