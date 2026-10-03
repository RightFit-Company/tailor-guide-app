import { useEffect, useState } from "react";

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac with touch support
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
    setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 py-8">
      <div className="w-full max-w-md rotate-[-0.5deg] rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-lg sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border-2 border-ink bg-brand font-display text-2xl font-bold text-white shadow-hard-sm">
              R
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">RightFit</span>
          </div>
          <span className="-rotate-3 rounded-full border-2 border-ink bg-sun px-3 py-1 font-display text-xs font-bold">
            Hello!
          </span>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-ink bg-paper p-4">
          <p className="text-center font-display text-base font-semibold leading-relaxed">
            © 2026 Peter Richard Smith
            <br />
            All rights reserved.
          </p>
        </div>

        {isIOS && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-ink bg-blue/10 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-blue font-display font-bold text-white">
              ↑
            </span>
            <div>
              <p className="font-display text-base font-bold">Add us to your Home Screen</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-ink/75">
                In Safari, tap the <strong>Share</strong> button (the box with the arrow), then
                choose <strong>Add to Home Screen</strong> to keep RightFit one tap away.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded-full border-2 border-ink bg-brand px-8 py-4 font-display text-lg font-bold text-white shadow-hard transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-hard-xs"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
