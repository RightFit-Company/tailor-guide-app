import { describe, expect, it } from "vitest";
import { toggleItem, type Kind } from "@/lib/outfit-rules";

const kinds: Record<string, Kind> = { t: "top", j: "trousers", l: "leggings", s: "skirt", d: "dress", c: "coat" };
const kindOf = (id: string) => kinds[id];

describe("outfit rules", () => {
  it("a dress removes top and bottoms", () => {
    expect(toggleItem({ top: "t", bottoms: "j" }, "d", "dress", kindOf)).toEqual({ dress: "d" });
  });
  it("a top removes a dress", () => {
    expect(toggleItem({ dress: "d" }, "t", "top", kindOf)).toEqual({ top: "t" });
  });
  it("a skirt keeps leggings but drops trousers", () => {
    expect(toggleItem({ bottoms: "l" }, "s", "skirt", kindOf)).toEqual({ bottoms: "l", skirt: "s" });
    expect(toggleItem({ bottoms: "j" }, "s", "skirt", kindOf)).toEqual({ skirt: "s" });
  });
  it("a coat goes over a top or a dress", () => {
    expect(toggleItem({ top: "t" }, "c", "coat", kindOf)).toEqual({ top: "t", outer: "c" });
    expect(toggleItem({ dress: "d" }, "c", "coat", kindOf)).toEqual({ dress: "d", outer: "c" });
  });
});
