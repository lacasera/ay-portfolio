import { useState } from "react";

export function ProductGallery({
  images,
  name,
  category,
}: {
  images: string[];
  name: string;
  category: string;
}) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const showImage = images.length > 0 && !failed[active];

  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100">
        {showImage ? (
          <img
            src={images[active]}
            alt={name}
            onError={() => setFailed((prev) => ({ ...prev, [active]: true }))}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium uppercase tracking-wide text-slate-400">
            {category}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              className={`h-16 w-12 overflow-hidden rounded border-2 ${
                index === active ? "border-indigo-500" : "border-transparent"
              }`}
            >
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover"
                onError={() =>
                  setFailed((prev) => ({ ...prev, [index]: true }))
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
