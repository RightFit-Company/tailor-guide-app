import type { GarmentType } from "./fit";

export type Gender = "womens" | "mens";

export interface SizeEntry {
  label: string;
  /** Approximate garment circumference in cm for that size */
  chest?: number;
  waist?: number;
  hips?: number;
}

export interface Brand {
  id: string;
  name: string;
  charts: Record<Gender, Record<GarmentType, SizeEntry[]>>;
}

/**
 * Typical inside-leg (cm) for a trouser size at position `index` in a chart.
 * Charts don't carry inseams, so we use standard high-street defaults:
 * womens regular ≈ 74 cm, mens regular ≈ 79 cm, growing slightly with size.
 */
export function typicalInseamCm(gender: Gender, sizeIndex: number): number {
  const base = gender === "mens" ? 79 : 74;
  return base + Math.max(0, sizeIndex);
}

/**
 * Approximate garment measurements per brand, gender and size.
 * Values are typical finished garment circumferences (cm), based on each
 * brand's published size guide plus standard wearing ease. High-street
 * brands vary season to season — treat these as honest estimates.
 */
export const BRANDS: Brand[] = [
  {
    id: "next",
    name: "Next",
    charts: {
      womens: {
        top: [
          { label: "XS (6–8)", chest: 88, waist: 74 },
          { label: "S (10–12)", chest: 96, waist: 82 },
          { label: "M (14–16)", chest: 104, waist: 90 },
          { label: "L (18–20)", chest: 112, waist: 98 },
          { label: "XL (22–24)", chest: 120, waist: 106 },
        ],
        trousers: [
          { label: "6–8", waist: 70, hips: 94 },
          { label: "10–12", waist: 78, hips: 102 },
          { label: "14–16", waist: 86, hips: 110 },
          { label: "18–20", waist: 94, hips: 118 },
          { label: "22–24", waist: 102, hips: 126 },
        ],
      },
      mens: {
        top: [
          { label: "XS", chest: 96, waist: 88 },
          { label: "S", chest: 102, waist: 94 },
          { label: "M", chest: 108, waist: 100 },
          { label: "L", chest: 114, waist: 106 },
          { label: "XL", chest: 120, waist: 112 },
          { label: "XXL", chest: 126, waist: 118 },
        ],
        trousers: [
          { label: "28", waist: 74, hips: 96 },
          { label: "30", waist: 79, hips: 101 },
          { label: "32", waist: 84, hips: 106 },
          { label: "34", waist: 89, hips: 111 },
          { label: "36", waist: 94, hips: 116 },
          { label: "38", waist: 99, hips: 121 },
        ],
      },
    },
  },
  {
    id: "primark",
    name: "Primark",
    charts: {
      womens: {
        top: [
          { label: "XS (6–8)", chest: 86, waist: 72 },
          { label: "S (10–12)", chest: 94, waist: 80 },
          { label: "M (14–16)", chest: 102, waist: 88 },
          { label: "L (18–20)", chest: 110, waist: 96 },
          { label: "XL (22–24)", chest: 118, waist: 104 },
        ],
        trousers: [
          { label: "6–8", waist: 68, hips: 92 },
          { label: "10–12", waist: 76, hips: 100 },
          { label: "14–16", waist: 84, hips: 108 },
          { label: "18–20", waist: 92, hips: 116 },
          { label: "22–24", waist: 100, hips: 124 },
        ],
      },
      mens: {
        top: [
          { label: "XS", chest: 94, waist: 86 },
          { label: "S", chest: 100, waist: 92 },
          { label: "M", chest: 106, waist: 98 },
          { label: "L", chest: 112, waist: 104 },
          { label: "XL", chest: 118, waist: 110 },
          { label: "XXL", chest: 124, waist: 116 },
        ],
        trousers: [
          { label: "28", waist: 72, hips: 94 },
          { label: "30", waist: 77, hips: 99 },
          { label: "32", waist: 82, hips: 104 },
          { label: "34", waist: 87, hips: 109 },
          { label: "36", waist: 92, hips: 114 },
          { label: "38", waist: 97, hips: 119 },
        ],
      },
    },
  },
  {
    id: "mands",
    name: "M&S",
    charts: {
      womens: {
        top: [
          { label: "8", chest: 90, waist: 76 },
          { label: "10", chest: 94, waist: 80 },
          { label: "12", chest: 98, waist: 84 },
          { label: "14", chest: 102, waist: 88 },
          { label: "16", chest: 106, waist: 92 },
          { label: "18", chest: 110, waist: 96 },
          { label: "20", chest: 114, waist: 100 },
        ],
        trousers: [
          { label: "8", waist: 70, hips: 94 },
          { label: "10", waist: 74, hips: 98 },
          { label: "12", waist: 78, hips: 102 },
          { label: "14", waist: 82, hips: 106 },
          { label: "16", waist: 86, hips: 110 },
          { label: "18", waist: 90, hips: 114 },
          { label: "20", waist: 94, hips: 118 },
        ],
      },
      mens: {
        top: [
          { label: "S", chest: 100, waist: 92 },
          { label: "M", chest: 106, waist: 98 },
          { label: "L", chest: 112, waist: 104 },
          { label: "XL", chest: 118, waist: 110 },
          { label: "XXL", chest: 124, waist: 116 },
        ],
        trousers: [
          { label: "30", waist: 78, hips: 100 },
          { label: "32", waist: 83, hips: 105 },
          { label: "34", waist: 88, hips: 110 },
          { label: "36", waist: 93, hips: 115 },
          { label: "38", waist: 98, hips: 120 },
          { label: "40", waist: 103, hips: 125 },
        ],
      },
    },
  },
  {
    id: "zara",
    name: "Zara",
    charts: {
      womens: {
        top: [
          { label: "XS", chest: 84, waist: 70 },
          { label: "S", chest: 90, waist: 76 },
          { label: "M", chest: 96, waist: 82 },
          { label: "L", chest: 102, waist: 88 },
          { label: "XL", chest: 108, waist: 94 },
        ],
        trousers: [
          { label: "XS", waist: 66, hips: 90 },
          { label: "S", waist: 72, hips: 96 },
          { label: "M", waist: 78, hips: 102 },
          { label: "L", waist: 84, hips: 108 },
          { label: "XL", waist: 90, hips: 114 },
        ],
      },
      mens: {
        top: [
          { label: "S", chest: 98, waist: 90 },
          { label: "M", chest: 104, waist: 96 },
          { label: "L", chest: 110, waist: 102 },
          { label: "XL", chest: 116, waist: 108 },
          { label: "XXL", chest: 122, waist: 114 },
        ],
        trousers: [
          { label: "30", waist: 76, hips: 98 },
          { label: "32", waist: 81, hips: 103 },
          { label: "34", waist: 86, hips: 108 },
          { label: "36", waist: 91, hips: 113 },
          { label: "38", waist: 96, hips: 118 },
        ],
      },
    },
  },
  {
    id: "hm",
    name: "H&M",
    charts: {
      womens: {
        top: [
          { label: "XS", chest: 86, waist: 72 },
          { label: "S", chest: 92, waist: 78 },
          { label: "M", chest: 98, waist: 84 },
          { label: "L", chest: 104, waist: 90 },
          { label: "XL", chest: 110, waist: 96 },
        ],
        trousers: [
          { label: "XS", waist: 68, hips: 92 },
          { label: "S", waist: 74, hips: 98 },
          { label: "M", waist: 80, hips: 104 },
          { label: "L", waist: 86, hips: 110 },
          { label: "XL", waist: 92, hips: 116 },
        ],
      },
      mens: {
        top: [
          { label: "S", chest: 100, waist: 92 },
          { label: "M", chest: 106, waist: 98 },
          { label: "L", chest: 112, waist: 104 },
          { label: "XL", chest: 118, waist: 110 },
          { label: "XXL", chest: 124, waist: 116 },
        ],
        trousers: [
          { label: "30", waist: 77, hips: 99 },
          { label: "32", waist: 82, hips: 104 },
          { label: "34", waist: 87, hips: 109 },
          { label: "36", waist: 92, hips: 114 },
          { label: "38", waist: 97, hips: 119 },
        ],
      },
    },
  },
  {
    id: "nike",
    name: "Nike",
    charts: {
      womens: {
        top: [
          { label: "XS", chest: 88, waist: 74 },
          { label: "S", chest: 94, waist: 80 },
          { label: "M", chest: 100, waist: 86 },
          { label: "L", chest: 106, waist: 92 },
          { label: "XL", chest: 112, waist: 98 },
        ],
        trousers: [
          { label: "XS", waist: 70, hips: 94 },
          { label: "S", waist: 76, hips: 100 },
          { label: "M", waist: 82, hips: 106 },
          { label: "L", waist: 88, hips: 112 },
          { label: "XL", waist: 94, hips: 118 },
        ],
      },
      mens: {
        top: [
          { label: "S", chest: 102, waist: 94 },
          { label: "M", chest: 108, waist: 100 },
          { label: "L", chest: 114, waist: 106 },
          { label: "XL", chest: 120, waist: 112 },
          { label: "XXL", chest: 126, waist: 118 },
        ],
        trousers: [
          { label: "S", waist: 78, hips: 100 },
          { label: "M", waist: 84, hips: 106 },
          { label: "L", waist: 90, hips: 112 },
          { label: "XL", waist: 96, hips: 118 },
          { label: "XXL", waist: 102, hips: 124 },
        ],
      },
    },
  },
  {
    id: "asos",
    name: "ASOS",
    charts: {
      womens: {
        top: [
          { label: "6", chest: 86, waist: 72 },
          { label: "8", chest: 90, waist: 76 },
          { label: "10", chest: 94, waist: 80 },
          { label: "12", chest: 98, waist: 84 },
          { label: "14", chest: 102, waist: 88 },
          { label: "16", chest: 106, waist: 92 },
        ],
        trousers: [
          { label: "6", waist: 68, hips: 92 },
          { label: "8", waist: 72, hips: 96 },
          { label: "10", waist: 76, hips: 100 },
          { label: "12", waist: 80, hips: 104 },
          { label: "14", waist: 84, hips: 108 },
          { label: "16", waist: 88, hips: 112 },
        ],
      },
      mens: {
        top: [
          { label: "XS", chest: 96, waist: 88 },
          { label: "S", chest: 102, waist: 94 },
          { label: "M", chest: 108, waist: 100 },
          { label: "L", chest: 114, waist: 106 },
          { label: "XL", chest: 120, waist: 112 },
        ],
        trousers: [
          { label: "28", waist: 74, hips: 96 },
          { label: "30", waist: 79, hips: 101 },
          { label: "32", waist: 84, hips: 106 },
          { label: "34", waist: 89, hips: 111 },
          { label: "36", waist: 94, hips: 116 },
        ],
      },
    },
  },
];

export function getSizeEntry(
  brandId: string,
  gender: Gender,
  garment: GarmentType,
  sizeLabel: string,
): SizeEntry | undefined {
  const brand = BRANDS.find((b) => b.id === brandId);
  return brand?.charts[gender][garment].find((s) => s.label === sizeLabel);
}
