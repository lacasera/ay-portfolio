import { Product, Segment } from "../product.entity";

const SEGMENTS: Segment[] = ["women", "men", "kids"];

interface ValidationRule {
  isSatisfied(product: Product): boolean;
  message(product: Product): string;
}

const RULES: ValidationRule[] = [
  { isSatisfied: (p) => Boolean(p.id), message: () => "missing id" },
  { isSatisfied: (p) => Boolean(p.name), message: () => "empty name" },
  { isSatisfied: (p) => Boolean(p.brand), message: () => "empty brand" },
  { isSatisfied: (p) => Boolean(p.category), message: () => "empty category" },
  {
    isSatisfied: (p) => p.categoryPath.length > 0,
    message: () => "empty category_path",
  },
  {
    isSatisfied: (p) => SEGMENTS.includes(p.segment),
    message: (p) => `invalid segment '${p.segment}'`,
  },
  {
    isSatisfied: (p) => p.price > 0,
    message: (p) => `price not positive (${p.price})`,
  },
  {
    isSatisfied: (p) => Boolean(p.embedText),
    message: () => "empty embed_text",
  },
];

export class ProductValidator {
  validate(products: Product[]): void {
    for (const product of products) {
      const brokenRule = RULES.find((rule) => !rule.isSatisfied(product));
      if (brokenRule) {
        throw new Error(
          `Invalid product ${product.id || "<no id>"}: ${brokenRule.message(product)}`
        );
      }
    }
  }
}
