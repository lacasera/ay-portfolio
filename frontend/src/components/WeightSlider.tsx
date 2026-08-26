export function WeightSlider({
  semanticWeight,
  onChange,
}: {
  semanticWeight: number;
  onChange: (semanticWeight: number) => void;
}) {
  const keywordPct = Math.round((1 - semanticWeight) * 100);
  const semanticPct = 100 - keywordPct;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500">
        Keyword {keywordPct}%
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={semanticWeight}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Keyword to semantic weight"
        className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-slate-300 to-indigo-400 accent-indigo-600"
      />
      <span className="text-xs font-medium text-indigo-600">
        Semantic {semanticPct}%
      </span>
    </div>
  );
}
