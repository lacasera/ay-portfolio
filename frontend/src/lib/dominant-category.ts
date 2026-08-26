import type { SearchHit } from "@ay/shared";

export function dominantCategory(hits: SearchHit[]): string | null {
  const scores = new Map<string, number>();
  hits.forEach((hit, index) => {
    const category = hit.source.category;
    scores.set(category, (scores.get(category) ?? 0) + 1 / (index + 1));
  });

  let best: string | null = null;
  let max = 0;
  for (const [category, score] of scores) {
    if (score > max) {
      max = score;
      best = category;
    }
  }
  return best;
}
