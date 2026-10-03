import type { BodyCm, BodyType, CupSize } from "@/lib/fit";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface AvatarMeasurements extends BodyCm {
  height?: number | undefined;
}

export interface AvatarProportions {
  height: number;
  shoulderWidth: number;
  chestWidth: number;
  chestDepth: number;
  waistWidth: number;
  waistDepth: number;
  hipWidth: number;
  hipDepth: number;
  inseam: number;
  torsoLength: number;
  armLength: number;
  headRadius: number;
}

/** Convert tape measurements in centimetres into stable metre-scale avatar dimensions. */
export function avatarProportions(
  body: AvatarMeasurements,
  bodyType: BodyType = "woman",
  cup: CupSize | "" = "",
): AvatarProportions {
  const height = clamp((body.height ?? 170) / 100, 1.35, 2.1);
  const chest = clamp((body.chest ?? height * 54) / 100, 0.68, 1.45);
  const waist = clamp((body.waist ?? chest * 0.84) / 100, 0.55, 1.35);
  const hips = clamp((body.hips ?? waist * (bodyType === "woman" ? 1.2 : 1.08)) / 100, 0.65, 1.5);
  const inseam = clamp((body.inseam ?? height * 100 * 0.45) / 100, height * 0.38, height * 0.54);
  const cupIndex = cup ? ["AA", "A", "B", "C", "D", "DD", "E", "F", "G", "H"].indexOf(cup) : 1;
  const cupDepth = bodyType === "woman" ? Math.max(0, cupIndex - 1) * 0.006 : 0;

  const chestWidth = clamp(chest / 2.65, height * 0.19, height * 0.29);
  const waistWidth = clamp(waist / 2.75, height * 0.15, chestWidth * 0.96);
  const hipWidth = clamp(hips / 2.72, waistWidth * 1.02, height * 0.3);

  return {
    height,
    shoulderWidth: clamp(chestWidth * (bodyType === "man" ? 1.3 : 1.17), hipWidth * 0.9, height * 0.34),
    chestWidth,
    chestDepth: chestWidth * (bodyType === "man" ? 0.64 : 0.69) + cupDepth,
    waistWidth,
    waistDepth: waistWidth * 0.72,
    hipWidth,
    hipDepth: hipWidth * (bodyType === "woman" ? 0.78 : 0.7),
    inseam,
    torsoLength: clamp(height - inseam - height * 0.19, height * 0.3, height * 0.42),
    armLength: height * 0.37,
    headRadius: height * 0.062,
  };
}