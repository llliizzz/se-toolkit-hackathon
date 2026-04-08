import { useEffect, useMemo, useRef, useState } from "react";

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function ContractHighlight({ analysis }) {
  const [activeClauseIndex, setActiveClauseIndex] = useState(null);
  const panelRef = useRef(null);

  const highlightHtml = useMemo(() => {
    const sourceText = analysis.contract_text || "";
    const lowerSourceText = sourceText.toLowerCase();

    // We collect non-overlapping substring matches so the contract keeps its original order
    // while still highlighting the risky excerpts returned by the LLM.
    const matches = analysis.clauses
      .map((clause, index) => {
        const normalizedClauseText = clause.clause_text.trim().toLowerCase();
        if (!normalizedClauseText) {
          return null;
        }
        const start = lowerSourceText.indexOf(normalizedClauseText);
        if (start === -1) {
          return null;
        }
        return {
          start,
          end: start + normalizedClauseText.length,
          index,
          clause,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.start - right.start);

    const nonOverlappingMatches = [];
    let lastEnd = -1;
    for (const match of matches) {
      if (match.start < lastEnd) {
        continue;
      }
      nonOverlappingMatches.push(match);
      lastEnd = match.end;
    }

    let cursor = 0;
    let html = "";
    for (const match of nonOverlappingMatches) {
      html += escapeHtml(sourceText.slice(cursor, match.start));
      html += `<mark class="highlight-mark highlight-${match.clause.risk_level}" data-clause-index="${match.index}">${escapeHtml(
        sourceText.slice(match.start, match.end),
      )}</mark>`;
      cursor = match.end;
    }
    html += escapeHtml(sourceText.slice(cursor));
    return html.replaceAll("\n", "<br />");
  }, [analysis]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setActiveClauseIndex(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const activeClause =
    activeClauseIndex === null ? null : analysis.clauses[Number(activeClauseIndex)] || null;

  return (
    <div className="highlight-panel" ref={panelRef}>
      <div className="highlight-header">
        <div>
          <p className="section-kicker">Contract text</p>
          <h2>Highlighted source contract</h2>
        </div>
      </div>

      <div
        className="highlight-content"
        onClick={(event) => {
          const mark = event.target.closest("[data-clause-index]");
          if (!mark) {
            return;
          }
          setActiveClauseIndex(mark.getAttribute("data-clause-index"));
        }}
        dangerouslySetInnerHTML={{ __html: highlightHtml }}
      />

      {activeClause ? (
        <div className="highlight-popup">
          <p className="popup-title">Why this part matters</p>
          <p>{activeClause.explanation}</p>
          <p className="suggestion">
            <em>💡 Suggestion: {activeClause.suggestion}</em>
          </p>
        </div>
      ) : (
        <p className="muted-copy">Click a highlighted clause to see the explanation and suggestion.</p>
      )}
    </div>
  );
}
