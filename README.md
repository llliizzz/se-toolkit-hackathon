# Legal Clause Risk Analyzer

AI assistant that analyzes contracts and highlights legal risks in simple language.

## Demo

Add screenshots here after deployment.

### Screenshot 1: Contract input screen

Place image at `docs/screenshots/input-screen.png`

### Screenshot 2: Risk analysis results

Place image at `docs/screenshots/risk-report.png`

## Product context

- **End users:** Freelancers, students, and everyday people without legal background
- **Problem:** People often sign contracts without understanding the risks hidden in legal language
- **Solution:** The product analyzes contract text using an LLM and returns a structured, plain-language breakdown of risky clauses, safety score, contract type, and follow-up explanations

## Features

### Implemented

- Paste contract text into a large editor
- Upload contract text from `.txt` and `.pdf` files
- Extract readable text from PDF documents
- LLM-powered contract risk analysis via OpenRouter
- Overall risk level
- Safety score with explanation
- Contract type detection
- Plain-language explanation and suggestion for each risky clause
- Highlighted contract text panel for risky excerpts
- History of saved analyses in PostgreSQL
- View and delete previous analyses
- Ask follow-up questions about an already analyzed contract
- Dark mode toggle
- Example contract button
- Character counter and validation warnings
- Animated analysis progress bar
- First-use onboarding tooltip

### Not yet implemented

- OCR for scanned PDF files without embedded text
- User authentication
- Export report as PDF
- Clause comparison across multiple contracts
- Legal jurisdiction-specific advice
- Multi-user history separation

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
│       └── .gitkeep
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
