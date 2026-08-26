import { useState } from "react";
import type { ReactNode } from "react";
import type { ProductDocument } from "@ay/shared";

export function ProductCard({
  product,
  onOpen,
}: {
  product: ProductDocument;
  onOpen: (product: ProductDocument) => void;
}) {
  const [imageOk, setImageOk] = useState(true);
  const image = product.images[0];
  const discounted =
    product.original_price !== null && product.original_price > product.price;

  return (
    <article
      onClick={() => onOpen(product)}
      className="group relative flex cursor-pointer flex-col rounded-lg bg-white ring-1 ring-slate-200 transition duration-200 hover:z-10 hover:shadow-lg hover:ring-slate-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-slate-100">
        {imageOk && image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            {product.category}
          </div>
        )}

        <div className="absolute left-2 top-2 flex gap-1">
          {product.premium && (
            <Badge className="bg-amber-100 text-amber-800">Premium</Badge>
          )}
          {!product.in_stock && (
            <Badge className="bg-slate-200 text-slate-600">Sold out</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {product.brand}
        </p>
        <h3 className="line-clamp-1 text-sm font-medium text-slate-900">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500">{product.category}</p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-full -translate-y-1 rounded-b-lg bg-white px-3 pb-3 pt-1 opacity-0 shadow-lg ring-1 ring-slate-200 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">
            €{product.price.toFixed(2)}
          </span>
          {discounted && (
            <span className="text-xs text-slate-400 line-through">
              €{product.original_price!.toFixed(2)}
            </span>
          )}
          {discounted && product.discount_pct !== null && (
            <span className="ml-auto text-xs font-semibold text-red-600">
              −{product.discount_pct}%
            </span>
          )}
        </div>
        {product.avg_rating !== null && (
          <p className="mt-1 text-xs text-slate-500">
            ★ {product.avg_rating.toFixed(1)}
            {product.rating_count !== null && (
              <span className="text-slate-400"> ({product.rating_count})</span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
