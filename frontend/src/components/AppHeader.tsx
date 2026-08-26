import type { SearchMode } from "@ay/shared";
import { ModeToggle } from "./ModeToggle";
import { SearchBar } from "./SearchBar";

export function AppHeader({
  query,
  onQueryChange,
  mode,
  onModeChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <span className="shrink-0 text-lg font-semibold tracking-tight">
          AY Search
        </span>
        <SearchBar value={query} onChange={onQueryChange} />
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>
    </header>
  );
}
