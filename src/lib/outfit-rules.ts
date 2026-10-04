export type Kind =
  | "top" | "hoodie" | "trousers" | "shorts" | "leggings" | "skirt" | "dress"
  | "blazer" | "coat" | "shoes" | "socks" | "hat" | "belt";
export const KINDS: Kind[] = ["top", "hoodie", "blazer", "coat", "dress", "skirt", "trousers", "shorts", "leggings", "shoes", "socks", "hat", "belt"];

export type Slot = "hat" | "outer" | "top" | "dress" | "skirt" | "bottoms" | "belt" | "socks" | "shoes";
export const SLOTS: { slot: Slot; label: string; emoji: string }[] = [
  { slot: "hat", label: "Hat", emoji: "🧢" },
  { slot: "outer", label: "Coat / blazer", emoji: "🧥" },
  { slot: "top", label: "Top", emoji: "👕" },
  { slot: "dress", label: "Dress", emoji: "👗" },
  { slot: "skirt", label: "Skirt", emoji: "🩱" },
  { slot: "bottoms", label: "Bottoms / leggings", emoji: "👖" },
  { slot: "belt", label: "Belt", emoji: "🪢" },
  { slot: "socks", label: "Socks", emoji: "🧦" },
  { slot: "shoes", label: "Shoes", emoji: "👟" },
];

export function slotOf(kind: Kind): Slot {
  if (kind === "trousers" || kind === "shorts" || kind === "leggings") return "bottoms";
  if (kind === "blazer" || kind === "coat") return "outer";
  if (kind === "hoodie") return "top";
  return kind;
}

export type Selection = Partial<Record<Slot, string>>;

/**
 * Toggle an item in the outfit, enforcing the wearing rules:
 * a dress replaces any top, skirt or bottoms; a skirt only pairs with leggings;
 * a coat/blazer goes over anything.
 */
export function toggleItem(sel: Selection, id: string, kind: Kind, kindOf: (id: string) => Kind | undefined): Selection {
  const slot = slotOf(kind);
  const next = { ...sel };
  if (next[slot] === id) {
    delete next[slot];
    return next;
  }
  next[slot] = id;
  if (kind === "dress") {
    delete next.top;
    delete next.skirt;
    delete next.bottoms;
  }
  if (slot === "top" || slot === "skirt" || slot === "bottoms") delete next.dress;
  if (kind === "skirt" && next.bottoms && kindOf(next.bottoms) !== "leggings") delete next.bottoms;
  if (slot === "bottoms" && kind !== "leggings") delete next.skirt;
  return next;
}
