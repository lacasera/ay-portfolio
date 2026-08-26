import type { ProductDocument, SearchMode } from "@ay/shared";
import type { SearchState } from "../hooks/useSearch";
import { ErrorBanner } from "./ErrorBanner";
import { SearchResultGrid } from "./SearchResultGrid";
import { WeightSlider } from "./WeightSlider";

export function SearchResults({
  query,
  mode,
  search,
  semanticWeight,
  onSemanticWeightChange,
  onOpen,
}: {
  query: string;
  mode: SearchMode;
  search: SearchState;
  semanticWeight: number;
  onSemanticWeightChange: (semanticWeight: number) => void;
  onOpen: (product: ProductDocument) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {search.data ? (
            <span>
              <strong className="text-slate-900">{search.data.total}</strong>{" "}
              results for “{query.trim()}” · {search.data.took_ms} ms ·{" "}
              <span className="capitalize">{mode}</span>
            </span>
          ) : (
            <span>Searching “{query.trim()}”…</span>
          )}
        </div>
        {mode === "hybrid" && (
          <WeightSlider
            semanticWeight={semanticWeight}
            onChange={onSemanticWeightChange}
          />
        )}
      </div>
      {search.error && <ErrorBanner message={search.error} />}
      {search.data && (
        <SearchResultGrid
          hits={search.data.hits}
          query={query}
          onOpen={onOpen}
        />
      )}
    </section>
  );
}
