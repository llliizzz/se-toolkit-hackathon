import { useEffect, useState } from "react";
import RiskReport from "./RiskReport";

export default function HistoryList({ apiUrl }) {
  const [items, setItems] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/analyses`);
      if (!response.ok) {
        throw new Error("Could not load analysis history.");
      }
      const data = await response.json();
      setItems(data);
    } catch (historyError) {
      setError(historyError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpen = async (id) => {
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/analyses/${id}`);
      if (!response.ok) {
        throw new Error("Could not load this analysis.");
      }
      const data = await response.json();
      setSelectedAnalysis(data);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/analyses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Could not delete this analysis.");
      }
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
      await loadHistory();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="history-layout">
      <div>
        <div className="history-header">
          <div>
            <p className="section-kicker">Saved analyses</p>
            <h2>History</h2>
          </div>
          <button type="button" className="secondary-button" onClick={loadHistory}>
            Refresh
          </button>
        </div>

        {loading ? <p className="muted-copy">Loading history...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        <div className="history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <div>
                <p className="history-time">{new Date(item.created_at).toLocaleString()}</p>
                <p className="history-preview">{item.preview}</p>
              </div>
              <div className="history-actions">
                <button type="button" className="secondary-button" onClick={() => handleOpen(item.id)}>
                  Open
                </button>
                <button type="button" className="danger-button" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div>
        {selectedAnalysis ? (
          <RiskReport analysis={selectedAnalysis} />
        ) : (
          <div className="empty-state">Open a saved analysis to view it here.</div>
        )}
      </div>
    </div>
  );
}
