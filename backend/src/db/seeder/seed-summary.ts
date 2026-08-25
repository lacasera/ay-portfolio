import { Product } from "../product.entity";

export class SeedSummary {
  private total = 0;
  private premiumCount = 0;
  private readonly categories = new Set<string>();
  private readonly countBySegment = new Map<string, number>();

  record(product: Product): void {
    this.total += 1;
    this.categories.add(product.category);
    if (product.premium) {
      this.premiumCount += 1;
    }
    this.countBySegment.set(
      product.segment,
      (this.countBySegment.get(product.segment) ?? 0) + 1
    );
  }

  get count(): number {
    return this.total;
  }

  format(): string {
    const segments = [...this.countBySegment]
      .map(([segment, n]) => `${segment} ${n}`)
      .join(", ");
    const premiumPct = this.total
      ? Math.round((this.premiumCount / this.total) * 100)
      : 0;
    return `Categories: ${this.categories.size} | Segments: ${segments} | Premium: ${this.premiumCount} (${premiumPct}%)`;
  }
}
