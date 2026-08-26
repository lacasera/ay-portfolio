import type { ProductDocument } from "@ay/shared";
import { ProductCard } from "./ProductCard";

export function ResultGrid({
  products,
  onOpen,
}: {
  products: ProductDocument[];
  onOpen: (product: ProductDocument) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        No products match.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onOpen={onOpen} />
      ))}
    </div>
  );
}
