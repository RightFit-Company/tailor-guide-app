import { Check } from "lucide-react";
import type { Kind } from "@/lib/outfit-rules";
import { Button } from "@/components/ui/button";

export type RailItem = { id: string; url: string; kind: Kind; description: string; color: string };

export default function ClothesRail({
  items,
  selectedIds,
  onSelect,
}: {
  items: RailItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={`relative h-auto min-w-0 whitespace-normal rounded-lg border-2 border-ink p-0 text-left shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:bg-card active:translate-x-0.5 active:translate-y-0.5 sm:shadow-[var(--shadow-hard-sm)] ${selected ? "bg-sun ring-2 ring-brand sm:ring-4" : "bg-card"}`}
          >
            <span className="flex w-full flex-col">
              <span className="relative aspect-square w-full overflow-hidden rounded-t-md bg-background p-2 sm:p-3">
                <img src={item.url} alt={item.description} className="h-full w-full object-contain" />
                {selected && <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-mint sm:right-2 sm:top-2 sm:h-8 sm:w-8"><Check aria-hidden="true" /></span>}
              </span>
              <span className="min-w-0 border-t-2 border-ink px-2.5 py-2.5 sm:px-3 sm:py-3">
                <span className="block text-xs font-bold uppercase text-muted-foreground">{item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}</span>
                <span className="mt-1 block truncate font-display text-sm font-bold capitalize sm:text-base">{item.description}</span>
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
