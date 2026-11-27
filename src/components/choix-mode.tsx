import { cn } from "@/lib/utils";

type Props = { duJour: boolean; onChange: (duJour: boolean) => void; desactive: boolean };

const MODES = [
  { duJour: false, libelle: "🎲 Au pif" },
  { duJour: true, libelle: "📅 Tirage du jour" },
];

export function ChoixMode({ duJour, onChange, desactive }: Props) {
  return (
    <div role="group" aria-label="Mode de tirage" className="mt-5 flex justify-center gap-3">
      {MODES.map((mode) => (
        <button
          key={mode.libelle}
          type="button"
          aria-pressed={mode.duJour === duJour}
          disabled={desactive}
          onClick={() => onChange(mode.duJour)}
          className={cn(
            "press rounded-full border-[3px] px-4 py-1.5 text-sm font-bold disabled:opacity-50",
            mode.duJour === duJour ? "bg-foreground text-background" : "bg-card",
          )}
        >
          {mode.libelle}
        </button>
      ))}
    </div>
  );
}
