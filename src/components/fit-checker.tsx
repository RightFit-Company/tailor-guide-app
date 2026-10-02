import { useEffect, useMemo, useState } from "react";
import {
  CM_PER_IN,
  VERDICT_META,
  computeFit,
  easeLabel,
  fmt,
  type BodyCm,
  type FitResult,
  type GarmentType,
  type Unit,
} from "@/lib/fit";

const STORAGE_KEY = "rightfit.body.v1";

type Values = { chest: string; waist: string; hips: string };
const EMPTY: Values = { chest: "", waist: "", hips: "" };

const BODY_FIELDS: { key: keyof Values; label: string; hint: string }[] = [
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

const GARMENT_FIELDS: Record<
  GarmentType,
  { key: keyof Values; label: string; hint: string }[]
> = {
  top: [
    { key: "chest", label: "Chest", hint: "Around the fullest part of the garment's chest." },
    { key: "waist", label: "Waist", hint: "Around the narrowest part of the garment's body." },
  ],
  trousers: [
    { key: "waist", label: "Waist", hint: "Around the inside of the waistband, laid relaxed." },
    { key: "hips", label: "Hips", hint: "Around the widest part of the seat and thighs." },
  ],
};

const STEPS = ["Your body", "The garment", "Verdict"] as const;

function parseValues(values: Values): BodyCm {
  const num = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return { chest: num(values.chest), waist: num(values.waist), hips: num(values.hips) };
}

function NumberField({
  label,
  hint,
  unit,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  unit: Unit;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label className="font-display text-lg font-semibold">{label}</label>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/45">
          {unit}
        </span>
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

export default function FitChecker() {
  const [unit, setUnit] = useState<Unit>("cm");
  const [step, setStep] = useState(1);
  const [garmentType, setGarmentType] = useState<GarmentType>("top");
  const [body, setBody] = useState<Values>(EMPTY);
  const [garment, setGarment] = useState<Values>(EMPTY);
  const [flat, setFlat] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBody({ ...EMPTY, ...(JSON.parse(saved) as Partial<Values>) });
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

  const switchUnit = (next: Unit) => {
    if (next === unit) return;
    const convert = (s: string) => {
      const n = Number(s);
      if (!s.trim() || !Number.isFinite(n)) return s;
      const v = next === "in" ? n / CM_PER_IN : n * CM_PER_IN;
      return String(Math.round(v * 10) / 10);
    };
    setBody((b) => ({ chest: convert(b.chest), waist: convert(b.waist), hips: convert(b.hips) }));
    setGarment((g) => ({ chest: convert(g.chest), waist: convert(g.waist), hips: convert(g.hips) }));
    setUnit(next);
  };

  const bodyParsed = parseValues(body);
  const garmentParsed = parseValues(garment);

  const bodyReady = bodyParsed.chest != null && bodyParsed.waist != null;
  const hipsMissing = garmentType === "trousers" && bodyParsed.hips == null;
  const garmentFields = GARMENT_FIELDS[garmentType];
  const garmentReady = garmentFields.every((f) => garmentParsed[f.key] != null);

  const result: FitResult | null = useMemo(() => {
    if (step !== 3) return null;
    return computeFit(garmentType, unit, bodyParsed, garmentParsed, flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, garmentType, unit, body, garment, flat]);

  const meta = result ? VERDICT_META[result.verdict] : null;
  const markerPos = result ? Math.min(97, Math.max(3, Math.round(result.tightness * 100))) : 50;

  const checkAnother = () => {
    setGarment(EMPTY);
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
        <div className="ml-auto flex rounded-full border-2 border-ink bg-paper p-0.5">
          {(["cm", "in"] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => switchUnit(u)}
              className={`rounded-full px-3 py-1 font-display text-xs font-bold uppercase transition-colors ${
                unit === u ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1 — body */}
      {step === 1 && (
        <div className="mt-6">
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Measure your body</h3>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Grab a soft tape measure. These are saved on your device so you only do this once.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {BODY_FIELDS.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                hint={f.hint}
                unit={unit}
                value={body[f.key]}
                onChange={(v) => setBody((b) => ({ ...b, [f.key]: v }))}
              />
            ))}
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
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Measure the garment</h3>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Lay it on a table and measure around the outside. Not sure? Measure straight across the
            front and tick “flat across” below — we’ll double it for you.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border-2 border-ink bg-paper p-1">
            {(["top", "trousers"] as GarmentType[]).map((t) => (
              <button
                key={t}
                onClick={() => setGarmentType(t)}
                className={`rounded-xl border-2 border-transparent px-4 py-2.5 font-display text-base font-bold capitalize transition-all ${
                  garmentType === t
                    ? "border-ink bg-white text-ink shadow-hard-xs"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {t === "top" ? "Top" : "Trousers"}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {garmentFields.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                hint={f.hint}
                unit={unit}
                value={garment[f.key]}
                onChange={(v) => setGarment((g) => ({ ...g, [f.key]: v }))}
              />
            ))}
          </div>

          <button
            onClick={() => setFlat((f) => !f)}
            className="mt-4 inline-flex items-center gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-2.5 text-sm font-semibold shadow-hard-xs transition-all hover:-translate-y-0.5 hover:shadow-hard-sm"
          >
            <span
              className={`grid size-5 place-items-center rounded-md border-2 border-ink font-display text-[11px] font-bold text-white ${
                flat ? "bg-mint" : "bg-white text-transparent"
              }`}
            >
              ✓
            </span>
            I measured flat across the front — double it for me
          </button>

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
                <span className="text-xs font-bold text-ink/50">Fill in the garment measurements</span>
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
              {garmentType}
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
              const fill = Math.min(100, Math.max(3, (row.bodyCm / row.garmentCm) * 100));
              return (
                <div key={row.label} className="rounded-2xl border-2 border-ink bg-paper/60 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-bold">{row.label}</span>
                    <span className="text-xs font-bold text-ink/60">
                      You {fmt(row.bodyCm, unit)} → garment {fmt(row.garmentCm, unit)} {unit}
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
                    <div
                      className={`h-full ${rowMeta.bar}`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-bold">
                    <span className="text-ink/55">Ease {easeLabel(row.easeCm, unit)}</span>
                    <span className={row.verdict === "right" ? "text-ink" : "text-ink/70"}>
                      {rowMeta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

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
