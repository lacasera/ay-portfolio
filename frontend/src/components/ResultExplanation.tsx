import type { ClauseContribution, Explanation, SearchHit } from "@ay/shared";
import { parseBm25, queryTerms } from "../lib/bm25";

export function ResultExplanation({
  hit,
  query,
}: {
  hit: SearchHit;
  query: string;
}) {
  return (
    <div className="rounded-b-lg border-x border-b border-slate-200 bg-slate-50 px-3 py-2">
      {hit.explanation.mode === "hybrid" ? (
        <HybridExplanation explanation={hit.explanation} />
      ) : (
        <KeywordExplanation
          tree={hit.explanation.bm25}
          query={query}
          score={hit.score}
        />
      )}
    </div>
  );
}

function HybridExplanation({
  explanation,
}: {
  explanation: Extract<Explanation, { mode: "hybrid" }>;
}) {
  return (
    <div className="space-y-1.5 text-xs">
      <ClauseRow label="Keyword" clause={explanation.keyword} />
      <ClauseRow label="Semantic" clause={explanation.semantic} />
      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-medium text-slate-700">
        <span>Fused score</span>
        <span>{explanation.fused.toFixed(3)}</span>
      </div>
      <p className="text-slate-500">{takeaway(explanation)}</p>
    </div>
  );
}

function ClauseRow({
  label,
  clause,
}: {
  label: string;
  clause: ClauseContribution;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-slate-400">{label}</span>
      {clause ? (
        <>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-200">
            <div
              className="h-full rounded bg-indigo-400"
              style={{ width: `${Math.max(6, 100 / clause.rank)}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-slate-600">
            #{clause.rank} · {clause.score.toFixed(3)}
          </span>
        </>
      ) : (
        <span className="flex-1 text-slate-400">no match</span>
      )}
    </div>
  );
}

function KeywordExplanation({
  tree,
  query,
  score,
}: {
  tree: unknown;
  query: string;
  score: number;
}) {
  const matches = parseBm25(tree);
  const matched = new Set(matches.flatMap((m) => m.terms));
  const unmatched = queryTerms(query).filter((term) => !matched.has(term));

  return (
    <div className="space-y-1 text-xs">
      {matches.map((match) => (
        <div
          key={`${match.field}:${match.terms.join("/")}`}
          className="flex items-center justify-between"
        >
          <span>
            <strong className="text-slate-700">
              {match.terms.join(" / ")}
            </strong>{" "}
            in <em className="not-italic text-slate-500">{match.field}</em>
          </span>
          <span className="tabular-nums text-slate-600">
            +{match.contribution.toFixed(2)}
          </span>
        </div>
      ))}
      {unmatched.map((term) => (
        <div key={term} className="text-slate-400">
          <em className="not-italic">{term}</em> — no match
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 font-medium text-slate-700">
        <span>Score</span>
        <span className="tabular-nums">{score.toFixed(2)}</span>
      </div>
    </div>
  );
}

function takeaway(
  explanation: Extract<Explanation, { mode: "hybrid" }>
): string {
  const hasKeyword = explanation.keyword !== null;
  const hasSemantic = explanation.semantic !== null;
  if (hasSemantic && !hasKeyword) return "Surfaced by semantic match";
  if (hasKeyword && !hasSemantic) return "Matched on keywords";
  if (hasKeyword && hasSemantic) return "Matched on keywords and meaning";
  return "Ranked by fused score";
}
