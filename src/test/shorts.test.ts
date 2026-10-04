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
    // Waist band (just right ≤ 5.08 cm): S waist ease 4 cm is right (miss 0),
    // hips ease 4 is slim (miss 1); M waist ease 12 is baggy (miss 6.9). S wins.
    const rec = recommendSize("shorts", { waist: 72, hips: 96 }, sizes);
    expect(rec.bestIndex).toBe(0);
  });
});

describe("waist band on bottoms", () => {
  it("treats more than 2 inches (5.08 cm) of waist ease as baggy", () => {
    const result = computeFit("trousers", "cm", { waist: 80, hips: 100 }, { waist: 86, hips: 110 }, false);
    const waist = result?.rows.find((row) => row.key === "waist");
    expect(waist?.easeCm).toBe(6);
    expect(waist?.verdict).toBe("baggy");
  });

  it("treats 2 inches (5.08 cm) or less of waist ease as just right", () => {
    const result = computeFit("trousers", "cm", { waist: 80, hips: 100 }, { waist: 85, hips: 110 }, false);
    const waist = result?.rows.find((row) => row.key === "waist");
    expect(waist?.easeCm).toBe(5);
    expect(waist?.verdict).toBe("right");
  });

  it("treats more than 7 cm of hip ease as baggy", () => {
    const result = computeFit("trousers", "cm", { waist: 80, hips: 100 }, { waist: 82, hips: 108 }, false);
    const hips = result?.rows.find((row) => row.key === "hips");
    expect(hips?.easeCm).toBe(8);
    expect(hips?.verdict).toBe("baggy");
  });

  it("treats 7 cm or less of hip ease as just right", () => {
    const result = computeFit("trousers", "cm", { waist: 80, hips: 100 }, { waist: 82, hips: 107 }, false);
    const hips = result?.rows.find((row) => row.key === "hips");
    expect(hips?.easeCm).toBe(7);
    expect(hips?.verdict).toBe("right");
  });

  it("keeps the loose top band for a top's waist row", () => {
    const result = computeFit("top", "cm", { chest: 90, waist: 80 }, { chest: 104, waist: 90 }, false);
    const waist = result?.rows.find((row) => row.key === "waist");
    expect(waist?.verdict).toBe("right");
  });
});
