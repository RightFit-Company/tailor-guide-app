import { createFileRoute, Link } from "@tanstack/react-router";
import FitChecker from "@/components/fit-checker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RightFit — Will it fit you right?" },
      {
        name: "description",
          content:
          "Enter your body measurements, pick a brand and size, and RightFit tells you if it will be baggy, slim, small, or just right.",
      },
      { property: "og:title", content: "RightFit — Will it fit you right?" },
      {
        property: "og:description",
        content:
          "Compare your body with any brand's size chart and get an honest fit verdict: baggy, slim, small, or just right.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RightFit — Will it fit you right?" },
      {
        name: "twitter:description",
        content:
          "Compare your body with any brand's size chart and get an honest fit verdict: baggy, slim, small, or just right.",
      },
    ],
  }),
  component: Index,
});

const FIT_CARDS = [
  {
    chip: "Baggy",
    chipClass: "bg-brand text-white",
    shadow: "shadow-[5px_5px_0_0_var(--brand)]",
    title: "Roomy & relaxed",
    text: "The garment runs well over your measurements. Laid-back, airflow, zero tension.",
    gap: "Lots of extra room",
  },
  {
    chip: "Slim",
    chipClass: "bg-blue text-white",
    shadow: "shadow-[5px_5px_0_0_var(--blue)]",
    title: "Close & tailored",
    text: "It hugs your frame with a little spare fabric. Contoured, but still comfortable.",
    gap: "A little spare room",
  },
  {
    chip: "Small",
    chipClass: "bg-sun text-ink",
    shadow: "shadow-[5px_5px_0_0_var(--sun)]",
    title: "Tight & snug",
    text: "It runs under your measurements. Fitted — and worth checking the seams before you commit.",
    gap: "Under your size",
  },
  {
    chip: "Just right",
    chipClass: "bg-mint text-white",
    shadow: "shadow-[5px_5px_0_0_var(--mint)]",
    title: "Perfectly dialed",
    text: "A comfortable window of ease over your body. Confident, effortless, no regrets.",
    gap: "The sweet spot",
  },
];

const MEASURE_CARDS = [
  {
    n: "01",
    title: "Height",
    text: "How tall you are, without shoes. Each measurement can be in cm or inches.",
  },
  {
    n: "02",
    title: "Chest",
    text: "Wrap the tape around the fullest part of your chest, keep it level, arms relaxed.",
  },
  {
    n: "03",
    title: "Waist",
    text: "Measure around the narrowest point of your torso, just above your navel.",
  },
  {
    n: "04",
    title: "Hips",
    text: "Measure around the fullest part of your hips and seat, feet together.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* Nav */}
      <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-brand font-display text-xl font-bold text-white shadow-hard-xs sm:size-11 sm:rounded-2xl sm:text-2xl sm:shadow-hard-sm">
            R
          </div>
          <span className="truncate font-display text-xl font-bold sm:text-2xl">RightFit</span>
        </div>
        <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a href="#check" className="transition-colors hover:text-brand">
            Check a fit
          </a>
          <a href="#how" className="transition-colors hover:text-brand">
            How it works
          </a>
          <a href="#measure" className="transition-colors hover:text-brand">
            Measure guide
          </a>
        </div>
        <Link
          to="/wardrobe"
          className="shrink-0 rounded-xl border-2 border-ink bg-sun px-3 py-2.5 font-display text-sm font-semibold text-ink shadow-hard-xs transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none sm:ml-auto sm:mr-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:shadow-hard-sm md:ml-0"
        >
          My Wardrobe
        </Link>
        <a
          href="#check"
          className="hidden rounded-2xl border-2 border-ink bg-ink px-4 py-3 font-display text-sm font-semibold text-white shadow-hard-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none sm:block sm:pl-5 sm:pr-4"
        >
          Start measuring
        </a>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute -right-16 -top-24 size-80 rounded-full bg-sun animate-bob"
          aria-hidden="true"
        />
        <div
          className="absolute -left-24 top-40 size-64 rounded-full bg-mint/40 animate-bob-slow"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:gap-14 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-2">
          <div>
            <span className="inline-block -rotate-2 rounded-full border-2 border-ink bg-blue px-4 py-2 font-display text-sm font-semibold text-white shadow-hard-xs">
              Fit, decoded
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:mt-7 sm:text-6xl lg:text-[5.5rem]">
              Will it fit <span className="text-brand">you</span>
              <br />
              right?
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-ink/75 sm:mt-6 sm:text-lg">
              Enter your body measurements, then pick the brand and size on the label. We'll tell
              you if it'll be baggy, slim, small, or just right.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:flex sm:flex-wrap sm:gap-4">
              <a
                href="#check"
                className="rounded-full border-2 border-ink bg-brand px-4 py-3 text-center font-display text-base font-bold text-white shadow-hard-sm transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-hard-xs sm:px-8 sm:py-4 sm:text-lg sm:shadow-hard"
              >
                Check a fit
              </a>
              <a
                href="#measure"
                className="rounded-full border-2 border-ink bg-white px-4 py-3 text-center font-display text-base font-bold text-ink shadow-[3px_3px_0_0_var(--sun)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0_0_var(--sun)] sm:px-8 sm:py-4 sm:text-lg sm:shadow-[5px_5px_0_0_var(--sun)]"
              >
                Measure me
              </a>
            </div>
            <div className="mt-7 flex items-center gap-3 sm:mt-9">
              <div className="flex -space-x-3">
                {[
                  { l: "J", cls: "bg-blue text-white" },
                  { l: "M", cls: "bg-sun text-ink" },
                  { l: "A", cls: "bg-mint text-ink" },
                ].map((a) => (
                  <div
                    key={a.l}
                    className={`grid size-10 place-items-center rounded-full border-2 border-paper font-display text-xs font-bold ${a.cls}`}
                  >
                    {a.l}
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-ink/65">
                Built for tops, trousers, and every size in between
              </p>
            </div>
          </div>

          {/* Demo fit report */}
          <div className="relative">
            <div className="rounded-3xl border-2 border-ink bg-white p-4 shadow-hard-sm sm:rotate-[1.5deg] sm:rounded-[2rem] sm:p-6 sm:shadow-hard-lg">
              <div className="flex items-center justify-between pb-4">
                <span className="font-display text-lg font-bold">Fit report</span>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                  Trousers
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 rounded-2xl border-2 border-ink bg-mint/25 p-4">
                  <p className="text-xs font-bold text-ink/55">Your waist</p>
                  <p className="font-display text-3xl font-bold">
                    32<i className="text-base">in</i>
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border-2 border-ink bg-sun/30 p-4">
                  <p className="text-xs font-bold text-ink/55">Garment</p>
                  <p className="font-display text-3xl font-bold">
                    35<i className="text-base">in</i>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink bg-brand/15 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-brand font-display font-bold text-white">
                  ✦
                </span>
                <div>
                  <p className="font-display text-xl font-bold leading-none">Just right</p>
                  <p className="mt-1 text-sm font-medium text-ink/70">Flattering, everyday fit</p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
                <div className="h-full w-[91%] rounded-full bg-mint" />
              </div>
              <p className="mt-3 text-xs font-semibold text-ink/60">
                Fit tightness · 91% · balanced
              </p>
            </div>
            <span className="absolute -bottom-5 -left-4 -rotate-6 rounded-full border-2 border-ink bg-sun px-4 py-2 font-display text-sm font-bold text-ink shadow-hard-sm">
              3 easy steps
            </span>
          </div>
        </div>
      </header>

      {/* Checker */}
      <section id="check" className="mx-auto max-w-4xl scroll-mt-8 px-3 pb-16 sm:px-6 sm:pb-24">
        <div className="mb-6 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Check a fit</h2>
          <p className="mx-auto mt-2 max-w-lg font-medium text-ink/65">
            Measure once, then check any brand and size against your body.
          </p>
        </div>
        <FitChecker />
      </section>

      {/* Four fits */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Four fits, one honest answer</h2>
        <p className="mb-10 mt-2 max-w-lg font-medium text-ink/70">
          We score the gap between your body and the garment, then name the silhouette you'd
          actually get.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FIT_CARDS.map((card) => (
            <div
              key={card.chip}
              className={`rounded-2xl border-2 border-ink bg-white p-5 transition-transform hover:-translate-y-1 sm:rounded-3xl sm:p-6 ${card.shadow}`}
            >
              <span
                className={`inline-block rounded-full border-2 border-ink px-3 py-1 font-display text-sm font-bold ${card.chipClass}`}
              >
                {card.chip}
              </span>
              <p className="mt-4 font-display text-xl font-bold">{card.title}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink/70">{card.text}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/45">
                {card.gap}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Measure guide */}
      <section id="measure" className="mx-auto max-w-6xl scroll-mt-8 px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="font-display text-3xl font-bold md:text-4xl">How to measure</h2>
        <p className="mb-10 mt-2 max-w-lg font-medium text-ink/70">
          A soft tape measure and two minutes is all it takes. Measure over bare skin or a thin
          layer — never over bulky clothing.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {MEASURE_CARDS.map((card) => (
            <div
              key={card.n}
              className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-xs sm:gap-4 sm:rounded-3xl sm:p-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-sun font-display text-base font-bold">
                {card.n}
              </span>
              <div>
                <p className="font-display text-lg font-bold">{card.title}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-ink/70">{card.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border-2 border-ink bg-mint/20 p-4 shadow-hard-sm sm:flex sm:flex-wrap sm:items-center sm:gap-4 sm:rounded-3xl sm:p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-mint font-display text-base font-bold">
            ✦
          </span>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-ink/80">
            <strong className="font-display text-base font-bold">Brand tip:</strong> sizes aren't
            standardised — a medium in one shop can be a large in another. RightFit uses each
            brand's own size guide, so the verdict matches the label you're actually holding.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm font-semibold text-ink/60 sm:px-6">
          <span className="font-display text-base font-bold text-ink">RightFit</span>
          <span>Measured gently, worn happily.</span>
        </div>
      </footer>
    </div>
  );
}
