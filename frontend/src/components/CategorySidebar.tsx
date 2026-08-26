import { CATEGORY_GROUPS } from "../constants";

export function CategorySidebar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <nav className="text-sm">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`mb-2 block w-full text-left font-semibold ${
          selected === null ? "text-indigo-600" : "text-slate-900"
        }`}
      >
        All products
      </button>

      {CATEGORY_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((category) => {
              const active = category === selected;
              return (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => onSelect(category)}
                    className={`block w-full rounded px-2 py-1 text-left transition ${
                      active
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {category}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
