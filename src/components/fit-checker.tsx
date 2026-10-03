import { Suspense, lazy, useEffect, useMemo, useState } from "react";

// 3D try-on viewer (src/components/body-viewer.tsx) — not yet wired into the verdict step.
void Suspense;
void lazy;
import {
  VERDICT_META,
  computeFit,
  easeLabel,
  recommendSize,
  fmt,
  toCm,
  type BodyCm,
  type BodyType,
  type CupSize,
  CUP_SIZES,
  adjustBodyForCup,
  type FitResult,
  type GarmentType,
  type Unit,
  estimateInseamCm,
  LENGTH_META,
} from "@/lib/fit";
import { BRANDS, getSizeEntry, typicalInseamCm, type Gender } from "@/lib/brands";

const STORAGE_KEY = "rightfit.body.v1";

type FieldValue = { value: string; unit: Unit };
type Values = { chest: FieldValue; waist: FieldValue; hips: FieldValue; height: FieldValue; leg: FieldValue };
const EMPTY: Values = {
  chest: { value: "", unit: "cm" },
  waist: { value: "", unit: "cm" },
  hips: { value: "", unit: "cm" },
  height: { value: "", unit: "cm" },
  leg: { value: "", unit: "cm" },
};

const BODY_FIELDS: { key: keyof Values; label: string; hint: string }[] = [
  {
    key: "height",
    label: "Height",
    hint: "How tall you are, without shoes.",
  },
  {
    key: "chest",
    label: "Chest",
    hint: "Around the fullest part of your chest, tape level, arms relaxed.",
  },
  {
    key: "waist",
    label: "Waist",
    hint: "Around the narrowest point of your torso, just above the navel.",
  },
  {
    key: "hips",
    label: "Hips",
    hint: "Around the fullest part of your hips and seat. Needed for trousers.",
  },
];

/** Older saved entries were plain strings in cm — wrap them so nothing is lost. */
function normalizeField(raw: unknown): FieldValue {
  if (typeof raw === "string") return { value: raw, unit: "cm" };
  if (raw && typeof raw === "object") {
    const f = raw as Partial<FieldValue>;
    return {
      value: typeof f.value === "string" ? f.value : "",
      unit: f.unit === "in" ? "in" : "cm",
    };
  }
  return { value: "", unit: "cm" };
}

function parseValues(values: Values): BodyCm & { height?: number | undefined } {
  const cm = (f: FieldValue) => {
    const trimmed = f.value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? toCm(n, f.unit) : undefined;
  };
  return {
    chest: cm(values.chest),
    waist: cm(values.waist),
    hips: cm(values.hips),
    height: cm(values.height),
    inseam: cm(values.leg),
  };
}

const STEPS = ["Your body", "The garment", "Verdict"] as const;

function NumberField({
  label,
  hint,
  unit,
  value,
  onChange,
  onUnitChange,
}: {
  label: string;
  hint: string;
  unit: Unit;
  value: string;
  onChange: (v: string) => void;
  onUnitChange: (u: Unit) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <label className="font-display text-lg font-semibold">{label}</label>
        <div className="flex rounded-full border-2 border-ink bg-paper p-0.5">
          {(["cm", "in"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onUnitChange(u)}
              aria-label={`${label} in ${u === "cm" ? "centimetres" : "inches"}`}
              className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold uppercase transition-colors ${
                unit === u ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={1}
        max={400}
        step="0.5"
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-ink bg-white px-4 py-2.5 font-display text-2xl font-semibold shadow-hard-xs outline-none placeholder:text-ink/25 focus:-translate-y-0.5 focus:shadow-hard-sm"
      />
      <p className="mt-2 text-xs font-medium leading-snug text-ink/60">{hint}</p>
    </div>
  );
}

function StepChip({ index, label, state }: { index: number; label: string; state: "active" | "done" | "todo" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${
        state === "active"
          ? "bg-brand text-white shadow-hard-xs"
          : state === "done"
            ? "bg-mint text-ink"
            : "bg-white text-ink/50"
      }`}
    >
      <span className="grid size-5 place-items-center rounded-full bg-ink font-display text-[10px] text-white">
        {state === "done" ? "✓" : index}
      </span>
      {label}
    </span>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-ink bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border-2 border-transparent px-4 py-2.5 font-display text-base font-bold transition-all ${
            value === o.value
              ? "border-ink bg-white text-ink shadow-hard-xs"
              : "text-ink/50 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function FitChecker() {
  const [step, setStep] = useState(1);
  const [body, setBody] = useState<Values>(EMPTY);
  const [gender, setGender] = useState<Gender>("womens");
  const [garmentType, setGarmentType] = useState<GarmentType>("top");
  const [brandId, setBrandId] = useState(BRANDS[0]!.id);
  const [sizeLabel, setSizeLabel] = useState<string>("");
  const [mode, setMode] = useState<"check" | "find">("check");
  const [bodyType, setBodyType] = useState<BodyType>("woman");
  const [cup, setCup] = useState<CupSize | "">("");
  const [legMode, setLegMode] = useState<"auto" | "manual">("auto");

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("rightfit.profile.v1") ?? "{}") as {
        bodyType?: BodyType;
        cup?: CupSize | "";
        legMode?: "auto" | "manual";
      };
      if (p.bodyType) {
        setBodyType(p.bodyType);
        setGender(p.bodyType === "man" ? "mens" : "womens");
      }
      if (p.cup) setCup(p.cup);
      if (p.legMode) setLegMode(p.legMode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("rightfit.profile.v1", JSON.stringify({ bodyType, cup, legMode }));
    } catch {
      // ignore
    }
  }, [bodyType, cup, legMode]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Record<keyof Values, unknown>>;
        setBody({
          chest: normalizeField(parsed.chest),
          waist: normalizeField(parsed.waist),
          hips: normalizeField(parsed.hips),
          height: normalizeField(parsed.height),
          leg: normalizeField(parsed.leg),
        });
      }
    } catch {
      // ignore unreadable storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(body));
    } catch {
      // ignore unwritable storage
    }
  }, [body]);


  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0]!;
  const sizes = brand.charts[gender][garmentType];
  const sizeEntry = sizeLabel ? getSizeEntry(brandId, gender, garmentType, sizeLabel) : undefined;

  const bodyRaw = parseValues(body);
  const bodyParsed = adjustBodyForCup(bodyRaw, garmentType, bodyType, cup);
  // Leg length: auto-estimated from height unless the user measured it themselves.
  const autoLegCm = bodyRaw.height != null ? estimateInseamCm(bodyRaw.height) : undefined;
  const legCm = legMode === "auto" ? autoLegCm : bodyRaw.inseam;
  const bodyReady = bodyRaw.chest != null && bodyParsed.waist != null;
  const hipsMissing = garmentType === "trousers" && bodyParsed.hips == null;
  const garmentReady = sizeEntry != null;
  const recommendation = useMemo(
    () => recommendSize(garmentType, bodyParsed, sizes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [garmentType, body, sizes, bodyType, cup],
  );

  const result: FitResult | null = useMemo(() => {
    if (step !== 3 || !sizeEntry) return null;
    // parseValues already converts each measurement to cm using its own unit.
    const bodyCm: BodyCm = bodyParsed;
    const garmentCm: BodyCm = {
      chest: sizeEntry.chest,
      waist: sizeEntry.waist,
      hips: sizeEntry.hips,
    };
    const sizeIndex = sizes.findIndex((s) => s.label === sizeEntry.label);
    const lengthInfo =
      garmentType === "trousers" && legCm != null && sizeIndex >= 0
        ? { legCm, inseamCm: typicalInseamCm(gender, sizeIndex) }
        : undefined;
    return computeFit(garmentType, "cm", bodyCm, garmentCm, false, lengthInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, garmentType, body, sizeEntry, bodyType, cup, legCm, gender, sizes]);

  const meta = result ? VERDICT_META[result.verdict] : null;
  const markerPos = result ? Math.min(97, Math.max(3, Math.round(result.tightness * 100))) : 50;
  // Each fit row is shown in the unit its measurement was entered in.
  const ROW_UNITS: Record<string, Unit> = {
    Chest: body.chest.unit,
    Waist: body.waist.unit,
    Hips: body.hips.unit,
  };
  const legUnit = legMode === "auto" ? body.height.unit : body.leg.unit;

  const checkAnother = () => {
    setSizeLabel("");
    setStep(2);
  };

  return (
    <div className="rounded-[2rem] border-2 border-ink bg-white p-5 shadow-hard-lg sm:p-8">
      {/* Step chips */}
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n === step ? "active" : n < step ? "done" : "todo";
          return <StepChip key={label} index={n} label={label} state={state} />;
        })}
      </div>

      {/* STEP 1 — body */}
      {step === 1 && (
        <div className="mt-6">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Measure your body</h3>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Grab a soft tape measure. These are saved on your device so you only do this once.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-5">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                Are you a…
              </p>
              <ToggleGroup<BodyType>
                options={[
                  { value: "woman", label: "Woman" },
                  { value: "man", label: "Man" },
                ]}
                value={bodyType}
                onChange={(t) => {
                  setBodyType(t);
                  setGender(t === "man" ? "mens" : "womens");
                  setSizeLabel("");
                }}
              />
            </div>
            {bodyType === "woman" && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                  Cup size (for tops)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CUP_SIZES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={cup === c}
                      onClick={() => setCup(cup === c ? "" : c)}
                      className={`min-w-10 rounded-xl border-2 border-ink px-2.5 py-1.5 font-display text-sm font-bold transition-all ${cup === c ? "bg-ink text-paper shadow-none" : "bg-white shadow-hard-xs hover:bg-sun/40"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {bodyType === "woman" && (
            <p className="mt-2 text-xs font-medium text-ink/55">
              Fuller cups need more room at the bust, so we add a little extra when checking tops.
            </p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BODY_FIELDS.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                hint={f.hint}
                unit={body[f.key].unit}
                value={body[f.key].value}
                onChange={(v) => setBody((b) => ({ ...b, [f.key]: { ...b[f.key], value: v } }))}
                onUnitChange={(u) => setBody((b) => ({ ...b, [f.key]: { ...b[f.key], unit: u } }))}
              />
            ))}
          </div>

          {/* Leg length — auto-estimated from height by default */}
          <div className="mt-3 rounded-2xl border-2 border-ink bg-paper/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold">Leg length (inside leg)</p>
                <p className="mt-0.5 text-xs font-medium text-ink/60">
                  Crotch to ankle — used to check trouser length.
                </p>
              </div>
              <div className="flex rounded-full border-2 border-ink bg-paper p-0.5">
                {(
                  [
                    { value: "auto", label: "Auto from height" },
                    { value: "manual", label: "Measure it" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setLegMode(o.value)}
                    aria-pressed={legMode === o.value}
                    className={`rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase transition-colors ${
                      legMode === o.value ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {legMode === "auto" ? (
              <p className="mt-3 text-sm font-bold text-ink/70">
                {autoLegCm != null ? (
                  <>
                    Estimated inside leg: {fmt(autoLegCm, body.height.unit)} {body.height.unit}
                    <span className="ml-2 font-medium text-ink/50">
                      (rough guess from your height — switch to “Measure it” for accuracy)
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-ink/50">
                    Add your height above and we'll estimate your inside leg from it.
                  </span>
                )}
              </p>
            ) : (
              <div className="mt-3 max-w-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={200}
                    step="0.5"
                    placeholder="—"
                    value={body.leg.value}
                    onChange={(e) => setBody((b) => ({ ...b, leg: { ...b.leg, value: e.target.value } }))}
                    className="w-full rounded-2xl border-2 border-ink bg-white px-4 py-2.5 font-display text-2xl font-semibold shadow-hard-xs outline-none placeholder:text-ink/25 focus:-translate-y-0.5 focus:shadow-hard-sm"
                  />
                  <div className="flex rounded-full border-2 border-ink bg-paper p-0.5">
                    {(["cm", "in"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setBody((b) => ({ ...b, leg: { ...b.leg, unit: u } }))}
                        aria-label={`Leg length in ${u === "cm" ? "centimetres" : "inches"}`}
                        className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold uppercase transition-colors ${
                          body.leg.unit === u ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {!bodyReady && (
              <span className="text-xs font-bold text-ink/50">Chest and waist are needed</span>
            )}
            <button
              disabled={!bodyReady}
              onClick={() => setStep(2)}
              className="rounded-2xl border-2 border-ink bg-brand px-6 py-3 font-display text-lg font-bold text-white shadow-hard transition-all enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-hard-xs disabled:opacity-40"
            >
              Next: the garment →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — garment */}
      {step === 2 && (
        <div className="mt-6">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Pick the garment</h3>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Tell us who it's for, the brand and the size on the label — we'll look up how that size
            actually measures.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                Who's it for?
              </p>
              <ToggleGroup<Gender>
                options={[
                  { value: "womens", label: "Womens" },
                  { value: "mens", label: "Mens" },
                ]}
                value={gender}
                onChange={(g) => {
                  setGender(g);
                  setSizeLabel("");
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                What is it?
              </p>
              <ToggleGroup<GarmentType>
                options={[
                  { value: "top", label: "Top" },
                  { value: "trousers", label: "Trousers" },
                ]}
                value={garmentType}
                onChange={(t) => {
                  setGarmentType(t);
                  setSizeLabel("");
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">Brand</p>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBrandId(b.id);
                    setSizeLabel("");
                  }}
                  className={`rounded-full border-2 border-ink px-4 py-2 font-display text-sm font-bold transition-all ${
                    brandId === b.id
                      ? "bg-brand text-white shadow-hard-xs"
                      : "bg-white text-ink/60 hover:text-ink"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 max-w-sm">
            <ToggleGroup<"check" | "find">
              options={[
                { value: "check", label: "Check a size" },
                { value: "find", label: "Find my size" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </div>

          {mode === "check" ? (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/45">
              Size on the label
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSizeLabel(s.label)}
                  className={`rounded-2xl border-2 border-ink px-4 py-2.5 font-display text-base font-bold transition-all ${
                    sizeLabel === s.label
                      ? "bg-ink text-white shadow-hard-xs"
                      : "bg-white text-ink/60 hover:text-ink"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          ) : hipsMissing ? (
            <p className="mt-4 text-sm font-bold text-ink/60">
              Add your hip measurement on the body step to find your trouser size.
            </p>
          ) : (
            <div className="mt-4">
              {recommendation.bestIndex >= 0 && (
                <div className="rounded-2xl border-2 border-ink bg-mint/30 p-4 shadow-hard-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/55">
                    Your best {brand.name} size
                  </p>
                  <p className="font-display text-4xl font-bold">
                    {recommendation.options[recommendation.bestIndex]!.size.label}
                  </p>
                  <p className="text-sm font-medium text-ink/70">
                    {VERDICT_META[recommendation.options[recommendation.bestIndex]!.result.verdict].label}{" "}
                    — {VERDICT_META[recommendation.options[recommendation.bestIndex]!.result.verdict].tagline.toLowerCase()}
                  </p>
                </div>
              )}
              <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                How every size would fit you
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendation.options.map((o, i) => {
                  const m = VERDICT_META[o.result.verdict];
                  return (
                    <button
                      key={o.size.label}
                      onClick={() => {
                        setSizeLabel(o.size.label);
                        setStep(3);
                      }}
                      className={`rounded-2xl border-2 border-ink px-3 py-2 text-left transition-all hover:-translate-y-0.5 ${
                        i === recommendation.bestIndex ? "bg-white shadow-hard-sm" : "bg-white"
                      }`}
                    >
                      <span className="block font-display text-base font-bold">{o.size.label}</span>
                      <span className={`mt-1 inline-block rounded-full border-2 border-ink px-2 text-[11px] font-bold ${m.chip}`}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-medium text-ink/50">Tap any size to see its full fit report.</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border-2 border-ink bg-white px-5 py-3 font-display font-bold shadow-hard-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              ← Body
            </button>
            <div className="flex items-center gap-3">
              {hipsMissing && (
                <span className="text-xs font-bold text-ink/50">
                  Trousers need your hip measurement too
                </span>
              )}
              {!garmentReady && !hipsMissing && (
                <span className="text-xs font-bold text-ink/50">Pick a size to continue</span>
              )}
              <button
                disabled={!garmentReady || hipsMissing}
                onClick={() => setStep(3)}
                className="rounded-2xl border-2 border-ink bg-brand px-6 py-3 font-display text-lg font-bold text-white shadow-hard transition-all enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-hard-xs disabled:opacity-40"
              >
                See my fit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — verdict */}
      {step === 3 && result && meta && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/50">
              Fit report
            </span>
            <span
              className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-bold capitalize ${meta.chip}`}
            >
              {brand.name} · {gender} · {sizeLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-5xl font-bold leading-none sm:text-6xl">
              {meta.label}
            </span>
            <span className="font-display text-lg font-semibold text-ink/60">{meta.tagline}</span>
          </div>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-ink/70">
            {meta.blurb} The tightest point is your {result.tightestLabel.toLowerCase()}.
          </p>

          {/* Fit meter */}
          <div className="mt-6">
            <div className="relative h-3 rounded-full border-2 border-ink bg-paper">
              <div
                className={`absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink ${meta.dot}`}
                style={{ left: `${markerPos}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-bold uppercase tracking-wider text-ink/50">
              <span>Baggy</span>
              <span>Small</span>
            </div>
          </div>

          {/* Per-measurement rows */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {result.rows.map((row) => {
              const rowMeta = VERDICT_META[row.verdict];
              const rowUnit = ROW_UNITS[row.label] ?? "cm";
              const fill = Math.min(100, Math.max(3, (row.bodyCm / row.garmentCm) * 100));
              return (
                <div key={row.label} className="rounded-2xl border-2 border-ink bg-paper/60 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-bold">{row.label}</span>
                    <span className="text-xs font-bold text-ink/60">
                      You {fmt(row.bodyCm, rowUnit)} → garment {fmt(row.garmentCm, rowUnit)}{" "}
                      {rowUnit}
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div
                      className={`h-full ${rowMeta.bar}`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-bold">
                    <span className="text-ink/55">Ease {easeLabel(row.easeCm, rowUnit)}</span>
                    <span className={row.verdict === "right" ? "text-ink" : "text-ink/70"}>
                      {rowMeta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs font-medium text-ink/50">
            Based on {brand.name}'s typical {gender} {garmentType} measurements for size{" "}
            {sizeLabel}. Brands vary season to season — when in doubt, try it on.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border-2 border-ink bg-white px-5 py-3 font-display font-bold shadow-hard-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              ← Edit measurements
            </button>
            <button
              onClick={checkAnother}
              className="rounded-2xl border-2 border-ink bg-ink px-6 py-3 font-display text-lg font-bold text-white shadow-hard-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Check another garment →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
