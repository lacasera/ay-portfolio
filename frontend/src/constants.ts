import type {
  ListingSort,
  SearchConfig,
  SearchMode,
  Segment,
} from "@ay/shared";

export const PAGE_SIZE = 24;

export const SEGMENTS: Segment[] = ["women", "men", "kids"];

export const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "relevance", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating_desc", label: "Top rated" },
];

export const CATEGORY_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Bags & backpacks",
    items: [
      "Crossbody bags",
      "Business & laptop bags",
      "Bum bags",
      "Backpacks",
      "Shoulder bags",
      "Handbags",
      "Tote bags",
    ],
  },
  {
    label: "Clothing",
    items: [
      "Dresses",
      "Jeans",
      "Tops",
      "Pants",
      "Jackets",
      "Sweaters & knitwear",
      "Coats",
      "Skirts",
      "Blouses & tunics",
      "Blazers",
      "Hoodies",
    ],
  },
  {
    label: "Shoes",
    items: [
      "Sneakers",
      "Ankle boots",
      "Boots",
      "Sandals",
      "High heels",
      "Ballet flats",
      "Slip-ons",
      "Sports shoes",
    ],
  },
  {
    label: "Accessories",
    items: [
      "Jewelry",
      "Scarves & wraps",
      "Hats & caps",
      "Belts",
      "Wallets & cases",
      "Sunglasses",
      "Smartphone cases",
    ],
  },
  {
    label: "Sportswear",
    items: [
      "Sports tops",
      "Sports bottoms & leggings",
      "Sports jackets",
      "Running shoes",
      "Outdoor shoes",
    ],
  },
];

export const CATEGORIES: string[] = CATEGORY_GROUPS.flatMap(
  (group) => group.items
);

export const DEFAULT_SEMANTIC_WEIGHT = 0.7;

export function buildSearchConfig(
  mode: SearchMode,
  semanticWeight = DEFAULT_SEMANTIC_WEIGHT
): SearchConfig {
  const semantic = Math.min(1, Math.max(0, semanticWeight));
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    mode,
    fields: { name: 3, description: 1, brand: 2 },
    useSynonyms: true,
    hybrid: {
      keywordWeight: round(1 - semantic),
      semanticWeight: round(semantic),
      k: 50,
    },
  };
}
