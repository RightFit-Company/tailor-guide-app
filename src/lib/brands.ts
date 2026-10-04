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
  /** Shorts share the trouser chart when a brand has no separate shorts chart. */
  charts: Record<Gender, { top: SizeEntry[]; trousers: SizeEntry[]; shorts?: SizeEntry[]; skirt?: SizeEntry[]; dress?: SizeEntry[] }>;
}

/** Size chart for a garment, falling back to the trouser chart for shorts/skirts and a top+trouser blend for dresses. */
export function getSizes(brand: Brand, gender: Gender, garment: GarmentType): SizeEntry[] {
  const chart = brand.charts[gender];
  if (garment === "dress" && !chart.dress) {
    // No dress chart: bust & waist from the top chart, hips from the same-position trouser size.
    return chart.top.map((t, i) => {
      const b = chart.trousers[Math.min(i, chart.trousers.length - 1)];
      return { label: t.label, chest: t.chest, waist: t.waist ?? b?.waist, hips: b?.hips ?? (t.chest != null ? t.chest + 4 : undefined) };
    });
  }
  return chart[garment] ?? chart.trousers;
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
  return brand ? getSizes(brand, gender, garment).find((s) => s.label === sizeLabel) : undefined;
}

type WomensStyle = "uk" | "letter";
type MensBottomStyle = "waist" | "letter";
interface Spec {
  id: string;
  name: string;
  /** cm offset vs. a typical UK high-street fit: negative = runs small, positive = runs large */
  offset?: number;
  womens?: WomensStyle;
  mensBottoms?: MensBottomStyle;
}

/** Builds approximate charts from standard UK high-street grading (4 cm per UK size, 6 cm per men's letter size, 5 cm per 2" waist). */
function makeBrand({ id, name, offset = 0, womens = "uk", mensBottoms = "waist" }: Spec): Brand {
  const o = offset;
  const ukNums = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  const wLetters = [
    { label: "XS (6–8)", i: 0.5 },
    { label: "S (10–12)", i: 2.5 },
    { label: "M (14–16)", i: 4.5 },
    { label: "L (18–20)", i: 6.5 },
    { label: "XL (22–24)", i: 8.5 },
  ];
  const wSteps = womens === "uk" ? ukNums.map((n, i) => ({ label: String(n), i })) : wLetters;
  const mLetters = ["XS", "S", "M", "L", "XL", "XXL"];
  const waists = [28, 30, 32, 34, 36, 38, 40];
  const r = (n: number) => Math.round(n);
  return {
    id,
    name,
    charts: {
      womens: {
        top: wSteps.map(({ label, i }) => ({ label, chest: r(86 + i * 4 + o), waist: r(72 + i * 4 + o) })),
        trousers: wSteps.map(({ label, i }) => ({ label, waist: r(68 + i * 4 + o), hips: r(92 + i * 4 + o) })),
      },
      mens: {
        top: mLetters.map((label, i) => ({ label, chest: r(96 + i * 6 + o), waist: r(88 + i * 6 + o) })),
        trousers:
          mensBottoms === "waist"
            ? waists.map((w, i) => ({ label: String(w), waist: r(74 + i * 5 + o), hips: r(96 + i * 5 + o) }))
            : mLetters.map((label, i) => ({ label, waist: r(72 + i * 6 + o), hips: r(94 + i * 6 + o) })),
      },
    },
  };
}

const MORE_BRANDS: Spec[] = [
  { id: "riverisland", name: "River Island" },
  { id: "newlook", name: "New Look" },
  { id: "topshop", name: "Topshop", offset: -1 },
  { id: "topman", name: "Topman", offset: -1 },
  { id: "boohoo", name: "boohoo", offset: -1 },
  { id: "boohooman", name: "boohooMAN", offset: -1 },
  { id: "plt", name: "PrettyLittleThing", offset: -2 },
  { id: "missguided", name: "Missguided", offset: -2 },
  { id: "nastygal", name: "Nasty Gal", offset: -1 },
  { id: "mango", name: "Mango", offset: -2, womens: "letter" },
  { id: "uniqlo", name: "Uniqlo", offset: -1, womens: "letter" },
  { id: "gap", name: "Gap", offset: 2, womens: "letter" },
  { id: "levis", name: "Levi's", offset: 0 },
  { id: "adidas", name: "Adidas", offset: 1, womens: "letter", mensBottoms: "letter" },
  { id: "puma", name: "Puma", womens: "letter", mensBottoms: "letter" },
  { id: "underarmour", name: "Under Armour", offset: -1, womens: "letter", mensBottoms: "letter" },
  { id: "gymshark", name: "Gymshark", offset: -2, womens: "letter", mensBottoms: "letter" },
  { id: "lululemon", name: "Lululemon", offset: -1, womens: "letter", mensBottoms: "letter" },
  { id: "northface", name: "The North Face", offset: 2, womens: "letter", mensBottoms: "letter" },
  { id: "superdry", name: "Superdry", offset: -2, womens: "letter" },
  { id: "hollister", name: "Hollister", offset: -2, womens: "letter" },
  { id: "abercrombie", name: "Abercrombie & Fitch", offset: -1, womens: "letter" },
  { id: "jackwills", name: "Jack Wills", offset: -1 },
  { id: "fatface", name: "FatFace", offset: 1 },
  { id: "whitestuff", name: "White Stuff", offset: 2 },
  { id: "joules", name: "Joules", offset: 1 },
  { id: "boden", name: "Boden", offset: 1 },
  { id: "seasalt", name: "Seasalt Cornwall", offset: 2 },
  { id: "whistles", name: "Whistles", offset: -1 },
  { id: "reiss", name: "Reiss", offset: -1 },
  { id: "tedbaker", name: "Ted Baker", offset: -1 },
  { id: "hobbs", name: "Hobbs" },
  { id: "phaseeight", name: "Phase Eight" },
  { id: "monsoon", name: "Monsoon", offset: 1 },
  { id: "oasis", name: "Oasis" },
  { id: "warehouse", name: "Warehouse", offset: -1 },
  { id: "dorothyperkins", name: "Dorothy Perkins", offset: 1 },
  { id: "wallis", name: "Wallis", offset: 1 },
  { id: "burton", name: "Burton" },
  { id: "jackjones", name: "Jack & Jones", offset: -1 },
  { id: "tommy", name: "Tommy Hilfiger", offset: 1, womens: "letter" },
  { id: "ralphlauren", name: "Ralph Lauren", offset: 1, womens: "letter" },
  { id: "calvinklein", name: "Calvin Klein", womens: "letter" },
  { id: "lacoste", name: "Lacoste", offset: -1, womens: "letter" },
  { id: "hugoboss", name: "BOSS", offset: -1, womens: "letter" },
  { id: "fredperry", name: "Fred Perry", offset: -1, womens: "letter" },
  { id: "bensherman", name: "Ben Sherman", womens: "letter" },
  { id: "barbour", name: "Barbour", offset: 2, womens: "uk" },
  { id: "weekday", name: "Weekday", offset: 1, womens: "letter" },
  { id: "monki", name: "Monki", womens: "letter" },
  { id: "otherstories", name: "& Other Stories", offset: -1 },
  { id: "cos", name: "COS", offset: 2, womens: "letter" },
  { id: "arket", name: "Arket", offset: 1, womens: "letter" },
  { id: "pullbear", name: "Pull&Bear", offset: -2, womens: "letter" },
  { id: "bershka", name: "Bershka", offset: -3, womens: "letter" },
  { id: "stradivarius", name: "Stradivarius", offset: -3, womens: "letter" },
  { id: "massimodutti", name: "Massimo Dutti", offset: -1, womens: "letter" },
  { id: "george", name: "George at Asda", offset: 1 },
  { id: "tu", name: "Tu (Sainsbury's)", offset: 1 },
  { id: "ff", name: "F&F (Tesco)", offset: 1 },
  { id: "matalan", name: "Matalan", offset: 1 },
  { id: "peacocks", name: "Peacocks" },
  { id: "lonsdale", name: "Lonsdale", womens: "letter", mensBottoms: "letter" },
  { id: "karrimor", name: "Karrimor", offset: 1, womens: "letter", mensBottoms: "letter" },
  { id: "everlast", name: "Everlast", womens: "letter", mensBottoms: "letter" },
  { id: "converse", name: "Converse", womens: "letter", mensBottoms: "letter" },
  { id: "vans", name: "Vans", womens: "letter", mensBottoms: "letter" },
  { id: "champion", name: "Champion", womens: "letter", mensBottoms: "letter" },
  { id: "dickies", name: "Dickies", offset: 2, womens: "letter" },
  { id: "carhartt", name: "Carhartt WIP", offset: 1, womens: "letter" },
  { id: "allsaints", name: "AllSaints", offset: -2, womens: "uk" },
  { id: "jigsaw", name: "Jigsaw" },
  { id: "karenmillen", name: "Karen Millen", offset: -1 },
  { id: "simplybe", name: "Simply Be", offset: 2 },
  { id: "evans", name: "Evans", offset: 2 },
  { id: "yoursclothing", name: "Yours Clothing", offset: 2 },
];

BRANDS.push(...MORE_BRANDS.map(makeBrand));
BRANDS.sort((a, b) => a.name.localeCompare(b.name));
