import { useEffect, useState } from "react";
import ContractInput from "./components/ContractInput";
import ContractHighlight from "./components/ContractHighlight";
import HistoryList from "./components/HistoryList";
import QuestionChat from "./components/QuestionChat";
import RiskReport from "./components/RiskReport";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [analysis, setAnalysis] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem("onboarding_done") !== "true",
  );

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const dismissOnboarding = () => {
    localStorage.setItem("onboarding_done", "true");
    setShowOnboarding(false);
  };

  return (
    <div className="app-shell">
      <div className="hero">
        <div className="hero-topline">
          <div>
            <p className="eyebrow">Plain-language contract review</p>
            <h1>Legal Clause Risk Analyzer</h1>
            <p className="hero-copy">
              Paste a contract or upload a .txt or .pdf file and get a clear breakdown of risky clauses,
              what they mean, and what you can do next.
            </p>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={activeTab === "analyze" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analyze")}
        >
          Analyze
        </button>
        <button
          type="button"
          className={activeTab === "history" ? "tab active" : "tab"}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {activeTab === "analyze" ? (
        <section className="panel">
          <div className="analyze-panel">
            <ContractInput
              apiUrl={API_URL}
              onAnalyze={setAnalysis}
              showOnboarding={showOnboarding}
              onDismissOnboarding={dismissOnboarding}
            />
          </div>

          {analysis ? (
            <>
              <div className="analysis-layout">
                <RiskReport analysis={analysis} />
                <ContractHighlight analysis={analysis} />
              </div>
              <QuestionChat apiUrl={API_URL} analysisId={analysis.id} />
            </>
          ) : null}
        </section>
      ) : (
        <section className="panel">
          <HistoryList apiUrl={API_URL} />
        </section>
      )}
    </div>
  );
}
