export type Unit = "cm" | "in";
export type GarmentType = "top" | "trousers";
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
};

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
};

export interface BodyCm {
  chest?: number | undefined;
  waist?: number | undefined;
  hips?: number | undefined;
}

export function computeFit(
  garment: GarmentType,
  unit: Unit,
  body: BodyCm,
  garmentMeasurements: BodyCm,
  flatAcross: boolean,
): FitResult | null {
  const rows: FitRow[] = [];
  for (const { key, label } of MEASURED_PAIRS[garment]) {
    const bodyValue = body[key];
    const garmentValue = garmentMeasurements[key];
    if (bodyValue == null || garmentValue == null) continue;
    const bodyCm = toCm(bodyValue, unit);
    const garmentCm = toCm(garmentValue, unit) * (flatAcross ? 2 : 1);
    const easeCm = garmentCm - bodyCm;
    rows.push({ label, bodyCm, garmentCm, easeCm, verdict: classifyEase(easeCm, garment) });
  }
  if (rows.length === 0) return null;

  const tightest = rows.reduce((a, b) => (b.easeCm < a.easeCm ? b : a));
  const tightness = Math.min(...rows.map((r) => r.bodyCm / r.garmentCm));

  return {
    garment,
    verdict: tightest.verdict,
    tightestLabel: tightest.label,
    tightness,
    rows,
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

/** How far (cm) each row's ease falls outside the "Just right" band; 0 = perfect. */
function rightBandMiss(result: FitResult): number {
  const t = RANGES[result.garment];
  return result.rows.reduce((sum, r) => {
    if (r.easeCm < t.slim) return sum + (t.slim - r.easeCm);
    if (r.easeCm >= t.right) return sum + (r.easeCm - t.right);
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
