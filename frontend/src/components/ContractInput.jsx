import { useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_CONTRACT = `FREELANCE SERVICE AGREEMENT

This Agreement is entered into as of January 1, 2025, between CLIENT CORP ("Client") and the undersigned freelancer ("Contractor").

1. SERVICES. Contractor agrees to perform web development services as directed by Client.

2. PAYMENT. Client will pay Contractor $50/hour. Client may modify the rate at any time without prior notice.

3. INTELLECTUAL PROPERTY. All work product, inventions, and materials created by Contractor shall be the sole and exclusive property of Client. Contractor waives all moral rights to the work.

4. CONFIDENTIALITY. Contractor shall not disclose any information related to Client's business, products, or clients, forever, even after termination of this agreement.

5. NON-COMPETE. Contractor agrees not to work for any competitor of Client for a period of 3 years after termination, worldwide.

6. TERMINATION. Client may terminate this agreement at any time, for any reason, without notice and without any obligation to pay for work already completed but not yet invoiced.

7. LIABILITY. Contractor's total liability shall not exceed $100. Client's liability is unlimited.

8. GOVERNING LAW. This agreement is governed by the laws of Delaware, USA.`;

const PROGRESS_STEPS = [
  { message: "📄 Reading contract...", duration: 1500, progress: 15 },
  { message: "🔍 Identifying risky clauses...", duration: 2000, progress: 35 },
  { message: "⚖️ Evaluating risk levels...", duration: 2000, progress: 55 },
  { message: "💡 Generating suggestions...", duration: 1500, progress: 75 },
  { message: "📊 Calculating safety score...", duration: 1000, progress: 90 },
  { message: "✅ Finalizing report...", duration: 0, progress: 96 },
];

export default function ContractInput({
  apiUrl,
  onAnalyze,
  showOnboarding,
  onDismissOnboarding,
}) {
  const [contractText, setContractText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressStep, setProgressStep] = useState(null);
  const timeoutRefs = useRef([]);
  const characterCount = contractText.length;
  const hasPdfUpload = Boolean(
    selectedFile && (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")),
  );
  const canAnalyze = loading ? false : hasPdfUpload || characterCount >= 100;

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    let elapsed = 0;
    setProgressStep(0);

    PROGRESS_STEPS.slice(0, -1).forEach((step, index) => {
      timeoutRefs.current.push(
        window.setTimeout(() => {
          setProgressStep(index + 1);
        }, elapsed + step.duration),
      );
      elapsed += step.duration;
    });

    return () => {
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, [loading]);

  const currentProgress = progressStep === null ? 0 : PROGRESS_STEPS[progressStep].progress;
  const progressMessage = progressStep === null ? "" : PROGRESS_STEPS[progressStep].message;
  const characterWarning = useMemo(() => {
    if (hasPdfUpload) {
      return "";
    }
    if (characterCount > 50000) {
      return "⚠️ Text is very long, analysis may be slow";
    }
    if (characterCount < 100) {
      return "⚠️ Text is too short for a meaningful analysis";
    }
    return "";
  }, [characterCount, hasPdfUpload]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setError("");
      setContractText("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setContractText(String(reader.result || ""));
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("contract_text", contractText);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Analysis failed.");
      }

      const data = await response.json();
      onAnalyze(data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
      setProgressStep(null);
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current = [];
    }
  };

  return (
    <div className="contract-form-shell">
      {showOnboarding ? (
        <div className="onboarding-tooltip">
          <strong>👋 Welcome!</strong>
          <p>Paste your contract here → click Analyze → get a plain-language risk report in seconds.</p>
          <button type="button" className="secondary-button" onClick={onDismissOnboarding}>
            Got it ✓
          </button>
        </div>
      ) : null}

      <form className="contract-form" onSubmit={handleSubmit}>
        <label className="section-title" htmlFor="contract-text">
          Contract text
        </label>
        <textarea
          id="contract-text"
          className="contract-textarea"
          placeholder="Paste your contract text here..."
          value={contractText}
          onChange={(event) => {
            setContractText(event.target.value);
            if (selectedFile) {
              setSelectedFile(null);
            }
          }}
        />

        <div className="textarea-meta">
          <p className="muted-copy">{characterCount} characters</p>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setSelectedFile(null);
              setError("");
              setContractText(EXAMPLE_CONTRACT);
            }}
          >
            Try an example contract
          </button>
        </div>

        {characterWarning ? (
          <p className={characterCount > 50000 ? "warning-message warning-danger" : "warning-message"}>
            {characterWarning}
          </p>
        ) : null}

        <div className="input-actions">
          <label className="upload-button" htmlFor="contract-file">
            Upload .txt or .pdf
          </label>
          <input
            id="contract-file"
            type="file"
            accept=".txt,.pdf,application/pdf,text/plain"
            onChange={handleFileChange}
          />

          <button type="submit" className="primary-button" disabled={!canAnalyze}>
            Analyze Contract
          </button>
        </div>

        {loading ? (
          <div className="progress-card" aria-live="polite">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${currentProgress}%` }} />
            </div>
            <p className="muted-copy">{progressMessage}</p>
          </div>
        ) : null}

        {selectedFile ? <p className="muted-copy">Selected file: {selectedFile.name}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}
      </form>
    </div>
  );
}
