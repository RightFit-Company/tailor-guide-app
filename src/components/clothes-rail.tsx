import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RailItem = { id: string; url: string; kind: "top" | "trousers"; description: string; color: string };

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={`relative h-auto min-w-0 whitespace-normal rounded-lg border-2 border-ink p-0 text-left shadow-[var(--shadow-hard-sm)] transition-transform hover:bg-card active:translate-x-0.5 active:translate-y-0.5 ${selected ? "bg-sun ring-4 ring-brand" : "bg-card"}`}
          >
            <span className="flex w-full flex-col">
              <span className="relative aspect-square w-full overflow-hidden rounded-t-md bg-background p-3">
                <img src={item.url} alt={item.description} className="h-full w-full object-contain" />
                {selected && <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-mint"><Check aria-hidden="true" /></span>}
              </span>
              <span className="min-w-0 border-t-2 border-ink px-3 py-3">
                <span className="block text-xs font-bold uppercase text-muted-foreground">{item.kind === "top" ? "Top" : "Trousers"}</span>
                <span className="mt-1 block truncate font-display text-base font-bold capitalize">{item.description}</span>
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
