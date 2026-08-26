import type { ProductDocument } from "@ay/shared";
import { capitalize } from "../lib/text";
import { DetailRow } from "./DetailRow";
import { ProductGallery } from "./ProductGallery";
import { Section } from "./Section";
import { Tag } from "./Tag";

export function ProductDetail({
  product,
  onBack,
}: {
  product: ProductDocument;
  onBack: () => void;
}) {
  const discounted =
    product.original_price !== null && product.original_price > product.price;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        ← Back to products
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          category={product.category}
        />

        <div className="max-w-lg">
          <nav className="text-xs text-slate-400">
            {product.category_path.join("  ›  ")}
          </nav>
          <p className="mt-3 text-sm font-medium uppercase tracking-wide text-slate-400">
            {product.brand}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            {discounted && (
              <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white">
                Sale
              </span>
            )}
            <span className="text-2xl font-semibold text-slate-900">
              €{product.price.toFixed(2)}
            </span>
          </div>
          {discounted && (
            <p className="mt-1 text-sm text-slate-500">
              Originally{" "}
              <span className="line-through">
                €{product.original_price!.toFixed(2)}
              </span>{" "}
              {product.discount_pct !== null && (
                <span className="font-semibold text-red-600">
                  −{product.discount_pct}%
                </span>
              )}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {product.premium && (
              <Tag className="bg-amber-100 text-amber-800">Premium</Tag>
            )}
            <Tag
              className={
                product.in_stock
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }
            >
              {product.in_stock ? "In stock" : "Sold out"}
            </Tag>
            {product.avg_rating !== null && (
              <Tag className="bg-slate-100 text-slate-600">
                ★ {product.avg_rating.toFixed(1)}
                {product.rating_count !== null && ` (${product.rating_count})`}
              </Tag>
            )}
          </div>

          <Section title="Sizes">
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <span
                  key={size}
                  className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700"
                >
                  {size}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Description">
            <p className="text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </Section>

          <Section title="Details">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <DetailRow label="Brand" value={product.brand} />
              <DetailRow label="Category" value={product.category} />
              <DetailRow label="Segment" value={capitalize(product.segment)} />
              <DetailRow label="Color" value={capitalize(product.color)} />
              {product.material && (
                <DetailRow label="Material" value={product.material} />
              )}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
