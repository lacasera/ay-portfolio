import type { ProductDocument, SearchHit } from "@ay/shared";
import { SearchResultCard } from "./SearchResultCard";

export function SearchResultGrid({
  hits,
  query,
  onOpen,
}: {
  hits: SearchHit[];
  query: string;
  onOpen: (product: ProductDocument) => void;
}) {
  if (hits.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        No products match.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {hits.map((hit) => (
        <SearchResultCard
          key={hit.id}
          hit={hit}
          query={query}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
