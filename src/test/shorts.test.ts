import { describe, expect, it } from "vitest";
import { classifyEase, computeFit, recommendSize } from "@/lib/fit";

describe("shorts", () => {
  it("uses the trouser ease bands", () => {
    expect(classifyEase(2, "shorts")).toBe("small");
    expect(classifyEase(5, "shorts")).toBe("slim");
    expect(classifyEase(12, "shorts")).toBe("right");
    expect(classifyEase(20, "shorts")).toBe("baggy");
  });

  it("measures waist and hips, with no length verdict", () => {
    const result = computeFit("shorts", "cm", { waist: 80, hips: 100 }, { waist: 90, hips: 112 }, false);
    expect(result?.rows.map((row) => row.label)).toEqual(["Waist", "Hips"]);
    expect(result?.length).toBeUndefined();
  });

  it("recommends the shorts size closest to the Just right band", () => {
    const sizes = [
      { label: "S", waist: 76, hips: 100 },
      { label: "M", waist: 84, hips: 108 },
    ];
    // S gives 4 cm ease (slim, outside the band); M gives 12 cm (just right) — M wins.
    const rec = recommendSize("shorts", { waist: 72, hips: 96 }, sizes);
    expect(rec.bestIndex).toBe(1);
  });
});
