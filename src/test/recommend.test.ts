import { describe, expect, it } from "vitest";
import { recommendSize } from "@/lib/fit";

const sizes = [
  { label: "S", chest: 96, waist: 82 },
  { label: "M", chest: 104, waist: 90 },
  { label: "L", chest: 112, waist: 98 },
];

describe("recommendSize", () => {
  it("picks the size that lands in the Just right band", () => {
    const { options, bestIndex } = recommendSize("top", { chest: 90, waist: 76 }, sizes);
    expect(options[bestIndex]!.size.label).toBe("M");
    expect(options[bestIndex]!.result.verdict).toBe("right");
  });
  it("picks the largest size when every size is too small", () => {
    const { options, bestIndex } = recommendSize("top", { chest: 130, waist: 120 }, sizes);
    expect(options[bestIndex]!.size.label).toBe("L");
  });
});
