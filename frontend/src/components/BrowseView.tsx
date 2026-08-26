import type { ProductDocument } from "@ay/shared";
import { PAGE_SIZE } from "../constants";
import type { ListingFilters, ListingState } from "../hooks/useListing";
import { BrowseControls } from "./BrowseControls";
import { ErrorBanner } from "./ErrorBanner";
import { Pagination } from "./Pagination";
import { ResultGrid } from "./ResultGrid";

export function BrowseView({
  filters,
  listing,
  onPatch,
  onOpen,
}: {
  filters: ListingFilters;
  listing: ListingState;
  onPatch: (patch: Partial<ListingFilters>) => void;
  onOpen: (product: ProductDocument) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {filters.category ?? "All products"}
        </h1>
        <BrowseControls filters={filters} onChange={onPatch} />
      </div>
      {listing.error && <ErrorBanner message={listing.error} />}
      {listing.data && (
        <>
          <ResultGrid products={listing.data.items} onOpen={onOpen} />
          <Pagination
            page={filters.page}
            size={PAGE_SIZE}
            total={listing.data.total}
            onPage={(page) => onPatch({ page })}
          />
        </>
      )}
    </section>
  );
}
