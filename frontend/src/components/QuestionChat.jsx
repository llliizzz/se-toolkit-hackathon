import { useState } from "react";

export default function QuestionChat({ apiUrl, analysisId }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qaPairs, setQaPairs] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/api/analyses/${analysisId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Could not get an answer.");
      }

      const data = await response.json();
      setQaPairs((current) => [...current, { question: trimmedQuestion, answer: data.answer }]);
      setQuestion("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <p className="section-kicker">Question mode</p>
          <h2>Ask a question about this contract</h2>
        </div>
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder='e.g. "What happens if I violate clause 3?"'
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button type="submit" className="primary-button" disabled={loading || !question.trim()}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="chat-history">
        {qaPairs.map((item, index) => (
          <div className="qa-pair" key={`${item.question}-${index}`}>
            <p className="qa-question">{item.question}</p>
            <div className="answer-bubble">{item.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
