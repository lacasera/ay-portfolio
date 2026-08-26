import type { Segment } from "@ay/shared";

const TABS: { value: Segment | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
];

export function SegmentTabs({
  segment,
  onChange,
}: {
  segment: Segment | null;
  onChange: (segment: Segment | null) => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4">
        {TABS.map((tab) => {
          const active = tab.value === segment;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`border-b-2 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
