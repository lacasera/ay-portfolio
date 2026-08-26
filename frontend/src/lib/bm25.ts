interface Bm25Node {
  value: number;
  description: string;
  details?: Bm25Node[];
}

export interface Bm25Match {
  field: string;
  terms: string[];
  contribution: number;
}

const WEIGHT = /^weight\((.+?) in \d+\)/;
const SYNONYM = /^Synonym\((.+)\)$/;

export function parseBm25(tree: unknown): Bm25Match[] {
  const matches: Bm25Match[] = [];

  const walk = (node: Bm25Node): void => {
    const weight = WEIGHT.exec(node.description);
    if (weight) {
      matches.push({ ...parseSpec(weight[1]), contribution: node.value });
      return;
    }
    node.details?.forEach(walk);
  };

  walk(tree as Bm25Node);
  return matches.sort((a, b) => b.contribution - a.contribution);
}

function parseSpec(spec: string): { field: string; terms: string[] } {
  const synonym = SYNONYM.exec(spec);
  const inner = synonym ? synonym[1] : spec;
  const pairs = inner.split(/\s+/).map((part) => {
    const separator = part.indexOf(":");
    return {
      field: part.slice(0, separator),
      term: part.slice(separator + 1),
    };
  });
  const field = (pairs[0]?.field ?? "").replace(/\.syn$/, "");
  const terms = [...new Set(pairs.map((pair) => pair.term))];
  return { field, terms };
}

export function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}
