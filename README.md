# Legal Clause Risk Analyzer

AI assistant that analyzes contracts and highlights legal risks in simple language.

![MIT License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![OpenRouter](https://img.shields.io/badge/LLM-OpenRouter-orange)

## Demo

| Contract Input | Risk Analysis Results |
|---|---|
| ![Input screen](docs/screenshots/input-screen.png) | ![Risk report](docs/screenshots/risk-report.png) |

| Input with example contract | Clause details and Q&A |
|---|---|
| ![Example contract](docs/screenshots/input-with-contract.png) | ![Clause and chat](docs/screenshots/clause-and-chat.png) |

## Product context

- **End users:** Freelancers, students, and everyday people without legal background
- **Problem:** People often sign contracts without understanding the risks hidden in legal language
- **Solution:** The product analyzes contract text using an LLM and returns a structured, plain-language breakdown of risky clauses, safety score, contract type, and follow-up explanations

## Overview

Legal Clause Risk Analyzer is a full-stack web application that helps non-lawyers review contract text in a clear and practical way. A user can paste a contract or upload a `.txt` or `.pdf` file, send it for LLM-powered analysis, and receive a readable report that explains risky clauses in simple language.

The application does more than just return a summary. It calculates a safety score, identifies the likely contract type, highlights risky excerpts inside the original contract text, stores analysis history in PostgreSQL, and lets the user ask follow-up questions about a previously analyzed document. The goal is not to replace a lawyer, but to help users understand what deserves attention before they sign.

The current version is designed as a practical review assistant rather than a legal document classifier only. It combines structured LLM output, deterministic backend post-processing, persistent storage, and a UI focused on readability. This means users can move from raw contract text to a saved, shareable, plain-language report without leaving the app.

Typical use cases include:

- reviewing freelance agreements before accepting work
- scanning NDAs for overbroad confidentiality or non-compete terms
- checking rental or service agreements for unfair liability and termination clauses
- preparing a simpler summary to discuss later with a lawyer, colleague, or client

## Features

### Implemented

- [x] Paste contract text into a large editor
- [x] Upload contract text from `.txt` and `.pdf` files
- [x] Extract readable text from PDF documents
- [x] LLM-powered contract risk analysis via OpenRouter
- [x] Overall risk level
- [x] Safety score with explanation
- [x] Contract type detection
- [x] Plain-language explanation and suggestion for each risky clause
- [x] Highlighted contract text panel for risky excerpts
- [x] History of saved analyses in PostgreSQL
- [x] View and delete previous analyses
- [x] Ask follow-up questions about an analyzed contract
- [x] Persist chat history for follow-up questions in the database
- [x] Dark mode toggle
- [x] Example contract button
- [x] Character counter and validation warnings
- [x] Animated analysis progress bar
- [x] First-use onboarding tooltip
- [x] Auto-scroll to results after analysis
- [x] Sync selected clause between the risk cards and highlighted contract text
- [x] Copy full report to clipboard
- [x] Async OpenRouter requests with `httpx`
- [x] Backend validation for very short and very long contract text
- [x] Database-backed follow-up message history endpoint
- [x] Deterministic server-side safety score calculation for more reproducible results
- [x] HTTP-ready clipboard fallback for non-secure deployments
- [x] Responsive two-column report and source-text review layout
- [x] Docker Compose healthcheck and restart policy for more robust startup

### Not yet implemented

- [ ] OCR for scanned PDF files without embedded text
- [ ] User authentication
- [ ] Export report as PDF
- [ ] Clause comparison across multiple contracts
- [ ] Legal jurisdiction-specific advice
- [ ] Multi-user history separation

## Usage

1. Open the web application in a browser.
2. Paste contract text into the textarea or upload a `.txt` or `.pdf` file.
3. Click **Analyze Contract**.
4. Review:
   - overall risk
   - safety score
   - contract type
   - summary
   - risky clauses with explanations and suggestions
5. Open the highlighted contract view to inspect flagged excerpts.
6. Ask follow-up questions in the Q&A section.
7. Use the **History** tab to reopen or delete previous analyses.

## User flow

1. The user opens the **Analyze** tab and either pastes contract text, uploads a file, or inserts the built-in example contract.
2. The interface validates the input length, shows a live character count, and disables analysis for very short text.
3. Once analysis starts, a staged progress bar explains what the app is doing while the backend sends the request to OpenRouter.
4. After the response arrives, the page scrolls smoothly to the results area.
5. The report presents the safety score, contract type, overall risk, summary, and clause-by-clause explanations.
6. The original contract is shown alongside the report with highlighted excerpts that match the detected risky clauses.
7. The user can click either the clause cards or the highlights to inspect the same clause from two views.
8. The result is saved automatically and can later be reopened from **History**, together with stored follow-up Q&A.

## Main functionality

### Contract analysis

The main workflow starts in the **Analyze** tab. The user can either paste the contract manually or upload a text-based file. The backend extracts the contract text, validates it, and sends it to OpenRouter for structured analysis.

The returned report includes:

- overall risk level
- safety score from 0 to 100
- safety score explanation
- detected contract type
- summary of the contract
- risky clauses with explanations and suggestions

### Highlighted contract review

After analysis, the page switches into a two-column review layout:

- the left side shows the structured risk report
- the right side shows the full original contract text with risky excerpts highlighted

Users can click a clause card in the report to jump to the matching text in the contract. They can also click a highlighted excerpt to open a small explanation popup with the clause meaning and suggested action.

### Follow-up question mode

Each saved analysis supports follow-up Q&A. The user can ask questions such as:

- what happens if I break a clause
- whether a payment term is safe
- what a specific clause means in plain language

The answer is generated using both the original contract text and the previous analysis result. Q&A pairs are saved in the database, so they remain available when the user reopens the analysis later from History.

### History and persistence

All analyses are stored in PostgreSQL together with:

- contract text
- structured analysis result
- extracted risky clauses
- safety score
- contract type
- follow-up chat messages

This allows the History tab to reopen earlier analyses and preserve the user’s context.

### Stable scoring and backend safeguards

The application does not rely entirely on the LLM for the final safety score. Risky clauses returned by the model are post-processed on the server, and the safety score is calculated deterministically from the number and severity of detected clauses. This makes the score more predictable across repeated runs.

The backend also protects the analysis pipeline by rejecting extremely short inputs and truncating oversized contract text before it is sent to the model. OpenRouter calls are executed asynchronously with `httpx`, so one slow LLM request does not block the whole FastAPI event loop.

### UX enhancements

The current version also includes several usability improvements:

- onboarding tooltip for first-time users
- dark mode toggle
- character counter and validation warnings
- example contract autofill
- animated analysis progress indicator
- automatic smooth scroll to the results section
- copy-to-clipboard report export

## Tech stack

- **Frontend:** React 18, Vite, plain CSS
- **Backend:** FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **LLM provider:** OpenRouter
- **Model default:** `openai/gpt-4o-mini`
- **PDF parsing:** `pypdf`
- **Async HTTP client:** `httpx`
- **Containerization:** Docker, Docker Compose

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Yes | Your API key from [openrouter.ai](https://openrouter.ai) |
| `OPENROUTER_MODEL` | Optional | Model to use (default: `openai/gpt-4o-mini`) |

## Deployment

- **OS:** Ubuntu 24.04
- **What should be installed on the VM:**
  - Docker
  - Docker Compose
  - Git
- **Environment variables required:**
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL` (default can be `openai/gpt-4o-mini`)

### Step-by-step deployment instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/llliizzz/se-toolkit-hackathon.git
   cd se-toolkit-hackathon
   ```

2. Create the environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and set your OpenRouter key:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=openai/gpt-4o-mini
   ```

4. Start all services:
   ```bash
   docker compose up --build
   ```

5. Open the application:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`

For external VM deployments, the frontend includes dynamic API host detection so that browser requests can still reach the backend even when the page is opened via a non-local IP address.

## Architecture

The application is built as a three-service Dockerized system:

- **frontend**: React 18 + Vite single-page application
- **backend**: FastAPI application with SQLAlchemy ORM
- **database**: PostgreSQL for persistent storage

The backend exposes REST endpoints for:

- contract analysis
- analysis history
- analysis detail retrieval
- deletion of previous analyses
- follow-up question mode
- loading persisted chat messages

The backend uses OpenRouter as the LLM gateway and sends structured prompts that return JSON. The app computes a deterministic safety score on the server side, which makes the score more stable and reproducible than relying on the model alone.

At the data layer, the system stores:

- the full original contract text
- the normalized analysis JSON returned to the client
- extracted risky clause rows for easier rendering and future expansion
- follow-up chat messages linked to each saved analysis

On startup, the backend also handles schema evolution for newer columns so existing databases can continue running without a destructive reset.

## API summary

Main API routes:

- `POST /api/analyze` — analyze pasted or uploaded contract text
- `GET /api/analyses` — list saved analyses
- `GET /api/analyses/{id}` — get a full saved analysis
- `DELETE /api/analyses/{id}` — delete an analysis
- `POST /api/analyses/{id}/ask` — ask a follow-up question about a saved contract
- `GET /api/analyses/{id}/messages` — fetch persisted chat history for an analysis

## Current limitations

- PDF support works for text-based PDFs; scanned image PDFs still need OCR
- the app explains risk in plain language but does not provide binding legal advice
- there is no user authentication yet, so the current history is not multi-user isolated
- export to PDF and comparison across multiple contracts are not implemented yet

## Local development (without Docker)

### Backend

Requirements: Python 3.11+, PostgreSQL running locally.

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env  # fill in your values
uvicorn main:app --reload --port 8000
```

### Frontend

Requirements: Node.js 20+.

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

Open `http://localhost:5173` in your browser.

## Project structure

```text
se-toolkit-hackathon/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── routers/
│       └── analysis.py
├── docs/
│   └── screenshots/
│       ├── clause-and-chat.png
│       ├── input-screen.png
│       ├── input-with-contract.png
│       └── risk-report.png
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles.css
        └── components/
            ├── ContractInput.jsx
            ├── RiskReport.jsx
            ├── HistoryList.jsx
            ├── ContractHighlight.jsx
            └── QuestionChat.jsx
```

## Tech stack

- **Frontend:** React 18, Vite, plain CSS
- **Backend:** FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **LLM integration:** OpenRouter API
- **Containerization:** Docker, Docker Compose
