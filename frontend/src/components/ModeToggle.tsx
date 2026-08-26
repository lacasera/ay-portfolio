import type { SearchMode } from "@ay/shared";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "keyword", label: "Keyword" },
  { value: "hybrid", label: "Hybrid" },
];

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-sm">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            mode === value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
