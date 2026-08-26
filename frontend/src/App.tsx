import { useState } from "react";
import type { ProductDocument, Segment, SearchMode } from "@ay/shared";
import { AppHeader } from "./components/AppHeader";
import { BrowseView } from "./components/BrowseView";
import { CategorySidebar } from "./components/CategorySidebar";
import { ProductDetail } from "./components/ProductDetail";
import { SearchResults } from "./components/SearchResults";
import { SegmentTabs } from "./components/SegmentTabs";
import { useListing, type ListingFilters } from "./hooks/useListing";
import { useSearch } from "./hooks/useSearch";
import { dominantCategory } from "./lib/dominant-category";

const INITIAL_FILTERS: ListingFilters = {
  category: null,
  segment: null,
  premium: null,
  inStock: null,
  sort: "relevance",
  page: 1,
};

export default function App() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("hybrid");
  const [filters, setFilters] = useState<ListingFilters>(INITIAL_FILTERS);
  const [selected, setSelected] = useState<ProductDocument | null>(null);

  const searching = query.trim().length > 0;
  const search = useSearch(query, mode);
  const listing = useListing(filters, !searching);

  const patchFilters = (patch: Partial<ListingFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  // Browse: the chosen filter. Search: the category the results land in.
  const selectedCategory = searching
    ? search.data
      ? dominantCategory(search.data.hits)
      : null
    : filters.category;

  const selectCategory = (category: string | null) => {
    setQuery("");
    patchFilters({ category, page: 1 });
  };

  const selectSegment = (segment: Segment | null) => {
    setQuery("");
    patchFilters({ segment, page: 1 });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SegmentTabs segment={filters.segment} onChange={selectSegment} />
      <AppHeader
        query={query}
        onQueryChange={setQuery}
        mode={mode}
        onModeChange={setMode}
      />

      {selected ? (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <ProductDetail product={selected} onBack={() => setSelected(null)} />
        </div>
      ) : (
        <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
          <aside className="hidden w-56 shrink-0 lg:block">
            <CategorySidebar
              selected={selectedCategory}
              onSelect={selectCategory}
            />
          </aside>

          <main className="min-w-0 flex-1">
            {searching ? (
              <SearchResults
                query={query}
                mode={mode}
                search={search}
                onOpen={setSelected}
              />
            ) : (
              <BrowseView
                filters={filters}
                listing={listing}
                onPatch={patchFilters}
                onOpen={setSelected}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
