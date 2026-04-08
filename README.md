# Legal Clause Risk Analyzer

AI assistant that analyzes contracts and highlights legal risks in simple language.

## Demo

(Placeholder: add screenshots here after deployment)

Screenshot 1: Contract input screen

Screenshot 2: Risk analysis results

## Product context

- **End users:** Freelancers, students, and everyday people without legal background
- **Problem:** People often sign contracts without understanding the risks hidden in legal language
- **Solution:** The product analyzes contract text using an LLM and returns a structured, plain-language breakdown of risky clauses

## Features

Implemented:

- Paste contract text into a large editor
- Upload contract text from a `.txt` or `.pdf` file
- LLM-powered clause risk analysis with high/medium/low severity via OpenRouter
- Plain-language explanations and practical suggestions for each risky clause
- Overall risk score and summary
- Analysis history stored in PostgreSQL
- View and delete past analyses

Not yet implemented:

- User authentication
- Export report as PDF
- Clause comparison across multiple contracts

## Usage

Open the web app, paste contract text or upload a `.txt` or text-based `.pdf` file, click **Analyze Contract**, and review the summary plus the risky clauses shown in the report. Use the **History** tab to reopen previous analyses or delete them.

## Deployment

- OS: Ubuntu 24.04
- Requirements: Docker, Docker Compose, an OpenRouter API key
- Step-by-step:
  1. Clone the repo.
  2. Copy `.env.example` to `.env`.
  3. Fill in `OPENROUTER_API_KEY` in `.env`.
  4. Run `docker compose up --build` from the project root.
  5. Open [http://localhost:5173](http://localhost:5173) in a browser.
