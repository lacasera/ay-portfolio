import type { ProductDocument, SearchMode } from "@ay/shared";
import type { SearchState } from "../hooks/useSearch";
import { ErrorBanner } from "./ErrorBanner";
import { SearchResultGrid } from "./SearchResultGrid";

export function SearchResults({
  query,
  mode,
  search,
  onOpen,
}: {
  query: string;
  mode: SearchMode;
  search: SearchState;
  onOpen: (product: ProductDocument) => void;
}) {
  return (
    <section>
      <div className="mb-4 text-sm text-slate-500">
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
