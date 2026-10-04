export type Unit = "cm" | "in";
export type GarmentType = "top" | "trousers" | "shorts" | "skirt" | "dress";

/** Bottoms sit on a waistband and use the tight waist/hip bands. */
export const isBottom = (g: GarmentType) => g === "trousers" || g === "shorts" || g === "skirt";
export type Verdict = "small" | "slim" | "right" | "baggy";

export const CM_PER_IN = 2.54;

export const toCm = (value: number, unit: Unit) =>
  unit === "cm" ? value : value * CM_PER_IN;

/**
 * Ease = garment circumference − body circumference, in cm.
 * Thresholds differ per garment type because trousers sit differently
 * from tops (waistbands stretch, hips need room to move).
 */
const RANGES: Record<GarmentType, { small: number; slim: number; right: number }> = {
  top: { small: 4, slim: 10, right: 20 },
  trousers: { small: 3, slim: 8, right: 16 },
  shorts: { small: 3, slim: 8, right: 16 },
  skirt: { small: 3, slim: 8, right: 16 },
  dress: { small: 4, slim: 10, right: 20 },
};

/**
 * Waistbands on bottoms need far less ease than hips or chest: more than
 * about two inches (5.08 cm) of spare room and they slide or gape.
 */
const WAIST_RANGE = { small: 0, slim: 2.5, right: 5.08 };

/** Hips on bottoms: up to about 7 inches (17.78 cm) of ease still reads as "Just right". */
const HIPS_RANGE = { small: 3, slim: 5, right: 17.78 };

/** Ease band for a given measurement row — bottoms use the tight waist/hip bands. */
function rangeFor(garment: GarmentType, key: "chest" | "waist" | "hips") {
  if (key === "waist" && isBottom(garment)) return WAIST_RANGE;
  if (key === "hips" && isBottom(garment)) return HIPS_RANGE;
  return RANGES[garment];
}

export function classifyEase(easeCm: number, garment: GarmentType): Verdict {
  const t = RANGES[garment];
  if (easeCm < t.small) return "small";
  if (easeCm < t.slim) return "slim";
  if (easeCm < t.right) return "right";
  return "baggy";
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; tagline: string; blurb: string; chip: string; bar: string; dot: string }
> = {
  small: {
    label: "Small",
    tagline: "Tight & snug",
    blurb: "This runs under your measurements — expect a squeeze, and mind the seams.",
    chip: "bg-sun text-ink",
    bar: "bg-sun",
    dot: "bg-sun",
  },
  slim: {
    label: "Slim",
    tagline: "Close & tailored",
    blurb: "Sits close to your frame with barely any spare fabric — contoured, but wearable.",
    chip: "bg-blue text-white",
    bar: "bg-blue",
    dot: "bg-blue",
  },
  right: {
    label: "Just right",
    tagline: "Perfectly dialed",
    blurb: "Comfortable room to move without drowning in fabric — the everyday sweet spot.",
    chip: "bg-mint text-ink",
    bar: "bg-mint",
    dot: "bg-mint",
  },
  baggy: {
    label: "Baggy",
    tagline: "Roomy & relaxed",
    blurb: "Plenty of extra room over your body — laid-back, airflow, zero tension.",
    chip: "bg-brand text-white",
    bar: "bg-brand",
    dot: "bg-brand",
  },
};

export interface FitRow {
  key: "chest" | "waist" | "hips";
  label: string;
  bodyCm: number;
  garmentCm: number;
  easeCm: number;
  verdict: Verdict;
}

export interface FitResult {
  garment: GarmentType;
  verdict: Verdict;
  tightestLabel: string;
  tightness: number; // 0..1, body as a share of garment at the tightest point
  rows: FitRow[];
  /** Trousers only: how the leg length compares to the garment's typical inseam. */
  length?: { legCm: number; inseamCm: number; diffCm: number; verdict: LengthVerdict } | undefined;
}

const MEASURED_PAIRS: Record<GarmentType, { key: "chest" | "waist" | "hips"; label: string }[]> = {
  top: [
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
  ],
  trousers: [
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
  ],
  shorts: [
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
  ],
  skirt: [
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
  ],
  dress: [
    { key: "chest", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
  ],
};

export interface BodyCm {
  chest?: number | undefined;
  waist?: number | undefined;
  hips?: number | undefined;
  inseam?: number | undefined;
}

/** Rough inside-leg estimate from overall height (≈45%). */
export function estimateInseamCm(heightCm: number): number {
  return Math.round(heightCm * 0.45);
}

export type LengthVerdict = "short" | "right" | "long";

/** diffCm = garment inseam − leg length. */
export function classifyLength(diffCm: number): LengthVerdict {
  if (diffCm < -2.5) return "short";
  if (diffCm > 2.5) return "long";
  return "right";
}

export const LENGTH_META: Record<LengthVerdict, { label: string; tagline: string; chip: string }> = {
  short: { label: "Too short", tagline: "These will likely sit above your ankle.", chip: "bg-sun text-ink" },
  right: { label: "Good length", tagline: "Should break nicely at your ankle.", chip: "bg-mint text-ink" },
  long: { label: "Too long", tagline: "Expect bunching or a trip to the tailor.", chip: "bg-brand text-white" },
};

export function computeFit(
  garment: GarmentType,
  unit: Unit,
  body: BodyCm,
  garmentMeasurements: BodyCm,
  flatAcross: boolean,
  lengthInfo?: { legCm: number; inseamCm: number },
): FitResult | null {
  const rows: FitRow[] = [];
  for (const { key, label } of MEASURED_PAIRS[garment]) {
    const bodyValue = body[key];
    const garmentValue = garmentMeasurements[key];
    if (bodyValue == null || garmentValue == null) continue;
    const bodyCm = toCm(bodyValue, unit);
    const garmentCm = toCm(garmentValue, unit) * (flatAcross ? 2 : 1);
    const easeCm = garmentCm - bodyCm;
    const t = rangeFor(garment, key);
    const verdict: Verdict =
      easeCm < t.small ? "small" : easeCm < t.slim ? "slim" : easeCm < t.right ? "right" : "baggy";
    rows.push({ key, label, bodyCm, garmentCm, easeCm, verdict });
  }
  if (rows.length === 0) return null;

  const tightest = rows.reduce((a, b) => (b.easeCm < a.easeCm ? b : a));
  const tightness = Math.min(...rows.map((r) => r.bodyCm / r.garmentCm));

  const length =
    garment === "trousers" && lengthInfo
      ? {
          legCm: lengthInfo.legCm,
          inseamCm: lengthInfo.inseamCm,
          diffCm: lengthInfo.inseamCm - lengthInfo.legCm,
          verdict: classifyLength(lengthInfo.inseamCm - lengthInfo.legCm),
        }
      : undefined;

  return {
    garment,
    verdict: tightest.verdict,
    tightestLabel: tightest.label,
    tightness,
    rows,
    length,
  };
}

/** Format a cm value in the chosen unit, one decimal, no trailing .0 */
export function fmt(cm: number, unit: Unit): string {
  const v = unit === "cm" ? cm : cm / CM_PER_IN;
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function easeLabel(easeCm: number, unit: Unit): string {
  const sign = easeCm < 0 ? "−" : "+";
  return `${sign}${fmt(Math.abs(easeCm), unit)} ${unit}`;
}

/**
 * How far (cm) each row's ease falls outside the "Just right" band; 0 = perfect.
 * On bottoms the waist counts fully while hips count at 30% — the waistband
 * decides whether trousers/shorts stay up, hips just need enough room.
 */
function rightBandMiss(result: FitResult): number {
  return result.rows.reduce((sum, r) => {
    const t = rangeFor(result.garment, r.key);
    const weight = r.key === "hips" && isBottom(result.garment) ? 0.3 : 1;
    if (r.easeCm < t.slim) return sum + (t.slim - r.easeCm) * weight;
    if (r.easeCm >= t.right) return sum + (r.easeCm - t.right) * weight;
    return sum;
  }, 0);
}

export interface SizeOption<S> {
  size: S;
  result: FitResult;
  miss: number;
}

/**
 * Compare a body (cm) against every size in a chart (cm). Returns all sizes
 * in chart order plus the index of the best one: lowest distance outside the
 * "Just right" band, ties going to the smaller size.
 */
export function recommendSize<S extends BodyCm>(
  garment: GarmentType,
  body: BodyCm,
  sizes: S[],
): { options: SizeOption<S>[]; bestIndex: number } {
  const options: SizeOption<S>[] = [];
  for (const size of sizes) {
    const result = computeFit(garment, "cm", body, size, false);
    if (result) options.push({ size, result, miss: rightBandMiss(result) });
  }
  let bestIndex = -1;
  options.forEach((o, i) => {
    if (bestIndex < 0 || o.miss < options[bestIndex]!.miss) bestIndex = i;
  });
  return { options, bestIndex };
}

export type BodyType = "woman" | "man";
export const CUP_SIZES = ["AA", "A", "B", "C", "D", "DD", "E", "F", "G", "H"] as const;
export type CupSize = (typeof CUP_SIZES)[number];

/** Extra bust room (cm) a top needs for a given cup — fuller cups need more ease at the chest. */
export function cupAllowanceCm(cup: CupSize | ""): number {
  const i = cup ? CUP_SIZES.indexOf(cup) : -1;
  return i <= 1 ? 0 : i - 1; // AA/A 0, B 1, C 2 ... H 8
}

/** Body used for a fit check: for women's tops the chest is bumped by the cup allowance. */
export function adjustBodyForCup(body: BodyCm, garment: GarmentType, bodyType: BodyType, cup: CupSize | ""): BodyCm {
  if ((garment !== "top" && garment !== "dress") || bodyType !== "woman" || body.chest == null) return body;
  return { ...body, chest: body.chest + cupAllowanceCm(cup) };
}
