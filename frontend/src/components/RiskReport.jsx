function RiskBadge({ level }) {
  return <span className={`badge badge-${level}`}>{level} risk</span>;
}

function ContractTypeBadge({ contractType }) {
  return <span className="badge badge-contract">📄 {contractType}</span>;
}

export default function RiskReport({ analysis }) {
  const safetyTone =
    analysis.safety_score >= 70 ? "safe" : analysis.safety_score >= 40 ? "caution" : "danger";

  return (
    <div className="report">
      <div className="score-panel">
        <div className={`score-ring score-${safetyTone}`}>
          <span>{analysis.safety_score}</span>
        </div>
        <div>
          <p className="section-kicker">Safety score</p>
          <h3 className="score-title">Contract safety score</h3>
          <p className="score-explainer">{analysis.safety_score_explanation}</p>
        </div>
      </div>

      <div className="report-header">
        <div>
          <p className="section-kicker">Analysis result</p>
          <h2>Your contract risk report</h2>
        </div>
        <div className="report-badges">
          <ContractTypeBadge contractType={analysis.contract_type} />
          <RiskBadge level={analysis.overall_risk} />
        </div>
      </div>

      <p className="summary-card">{analysis.summary}</p>

      {analysis.clauses.length === 0 ? (
        <div className="empty-state">No significant risks found ✅</div>
      ) : (
        <div className="clause-list">
          {analysis.clauses.map((clause, index) => (
            <article className="clause-card" key={`${clause.clause_text}-${index}`}>
              <div className="clause-topline">
                <h3>Clause {index + 1}</h3>
                <RiskBadge level={clause.risk_level} />
              </div>
              <blockquote>{clause.clause_text}</blockquote>
              <p>{clause.explanation}</p>
              <p className="suggestion">
                <em>💡 Suggestion: {clause.suggestion}</em>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
