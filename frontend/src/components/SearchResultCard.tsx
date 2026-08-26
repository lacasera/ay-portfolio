import { useState } from "react";
import type { ProductDocument, SearchHit } from "@ay/shared";
import { ProductCard } from "./ProductCard";
import { ResultExplanation } from "./ResultExplanation";

export function SearchResultCard({
  hit,
  query,
  onOpen,
}: {
  hit: SearchHit;
  query: string;
  onOpen: (product: ProductDocument) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <ProductCard product={hit.source} onOpen={onOpen} />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-1 flex w-full items-center justify-between rounded px-1 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-900"
      >
        Why did this rank?
        <span className={open ? "rotate-180" : ""}>▾</span>
      </button>
      {open && <ResultExplanation hit={hit} query={query} />}
    </div>
  );
}
