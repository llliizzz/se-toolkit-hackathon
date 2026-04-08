import json
import os
from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pypdf import PdfReader
import requests
from sqlalchemy.orm import Session

from database import get_db
from models import Analysis, RiskClause
from schemas import (
    AnalyzeRequest,
    AnalysisDetail,
    AnalysisListItem,
    AnalysisResult,
    AskRequest,
    AskResponse,
    ClauseResult,
    DeleteResponse,
)

router = APIRouter(prefix="/api", tags=["analysis"])

SYSTEM_PROMPT = (
    "You are a legal risk analysis assistant. Your job is to read contract text "
    "and identify clauses that could be risky or unfavorable for the signing party. "
    "Always respond ONLY with a valid JSON object - no markdown, no explanation outside the JSON."
)

ASK_SYSTEM_PROMPT = (
    "You are a legal assistant helping a non-lawyer understand a contract they previously analyzed. "
    "You have the full contract text and the risk analysis results. "
    "Answer the user's question in simple, plain language. Be concise (max 3 sentences). "
    'Do not give formal legal advice. Always end with: "For binding legal advice, consult a qualified lawyer."'
)

USER_PROMPT_TEMPLATE = """Analyze the following contract text. Identify all clauses that could be risky or problematic for the person signing it. For each risky clause, provide:
- clause_text: the exact excerpt from the contract
- risk_level: one of "high", "medium", "low"
- explanation: a plain-language explanation of why this clause is risky (max 2 sentences, simple words)
- suggestion: a practical suggestion for what the signer could do (max 1 sentence)

Also provide:
- overall_risk: one of "high", "medium", "low"
- contract_type: choose exactly one of "NDA", "Freelance Agreement", "Rental Agreement", "Employment Contract", "Service Agreement", "Other"
- summary: a 2-3 sentence plain-language summary of the contract's overall risk

Respond ONLY with this JSON structure:
{{
  "overall_risk": "...",
  "contract_type": "...",
  "summary": "...",
  "clauses": [
    {{
      "clause_text": "...",
      "risk_level": "...",
      "explanation": "...",
      "suggestion": "..."
    }}
  ]
}}

Contract text:
{contract_text}
"""

ASK_USER_PROMPT_TEMPLATE = """Contract text:
{contract_text}

Previous risk analysis:
{result_json}

User question: {question}
"""


def _extract_text_from_upload(upload: UploadFile | None) -> str | None:
    if upload is None:
        return None
    if not upload.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must have a filename")

    filename = upload.filename.lower()
    raw_bytes = upload.file.read()

    if filename.endswith(".txt"):
        try:
            return raw_bytes.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded .txt file must be UTF-8 text") from exc

    if filename.endswith(".pdf"):
        try:
            reader = PdfReader(BytesIO(raw_bytes))
            extracted_pages = [page.extract_text() or "" for page in reader.pages]
            extracted_text = "\n".join(extracted_pages).strip()
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not read the uploaded PDF") from exc

        if not extracted_text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable text found in the uploaded PDF")
        return extracted_text

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .txt and .pdf uploads are supported")


async def _get_contract_text(request: Request, contract_text: str | None, upload: UploadFile | None) -> str:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            payload = AnalyzeRequest.model_validate(await request.json())
            resolved_text = payload.contract_text.strip()
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON request body") from exc
        if not resolved_text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract text is required")
        return resolved_text

    uploaded_text = _extract_text_from_upload(upload)
    resolved_text = (contract_text or "").strip() or (uploaded_text or "").strip()
    if not resolved_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract text is required")
    return resolved_text


def _openrouter_chat(messages: list[dict[str, str]], response_format: dict | None = None) -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="OPENROUTER_API_KEY is not configured")

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0,
    }
    if response_format is not None:
        payload["response_format"] = response_format

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Legal Clause Risk Analyzer",
            },
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"LLM request failed: {exc}") from exc

    return response.json()


def _compute_safety_score(clauses: list[ClauseResult]) -> tuple[int, str]:
    high_count = sum(1 for clause in clauses if clause.risk_level == "high")
    medium_count = sum(1 for clause in clauses if clause.risk_level == "medium")
    low_count = sum(1 for clause in clauses if clause.risk_level == "low")

    deductions = (high_count * 15) + (medium_count * 7) + (low_count * 3)
    safety_score = max(0, 100 - deductions)

    if high_count == 0 and medium_count == 0 and low_count == 0:
        explanation = "No risky clauses were identified, so the contract kept the maximum safety score."
    else:
        explanation = (
            f"The score was reduced by {high_count} high-risk, {medium_count} medium-risk, "
            f"and {low_count} low-risk clauses under the fixed scoring formula."
        )

    return safety_score, explanation


def _call_llm(contract_text: str) -> AnalysisResult:
    data = _openrouter_chat(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(contract_text=contract_text)},
        ],
        response_format={"type": "json_object"},
    )

    try:
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        clauses = [ClauseResult(**clause) for clause in parsed.get("clauses", [])]
        safety_score, safety_score_explanation = _compute_safety_score(clauses)
        parsed["clauses"] = [clause.model_dump() for clause in clauses]
        parsed["safety_score"] = safety_score
        parsed["safety_score_explanation"] = safety_score_explanation
        return AnalysisResult.model_validate(parsed)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM response parsing failed") from exc


def _ask_llm(contract_text: str, result_json: str, question: str) -> str:
    data = _openrouter_chat(
        [
            {"role": "system", "content": ASK_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": ASK_USER_PROMPT_TEMPLATE.format(
                    contract_text=contract_text,
                    result_json=result_json,
                    question=question,
                ),
            },
        ],
    )
    try:
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM answer parsing failed") from exc


def _serialize_analysis(analysis: Analysis) -> AnalysisDetail:
    payload = json.loads(analysis.result_json)
    return AnalysisDetail(
        id=analysis.id,
        created_at=analysis.created_at,
        contract_text=analysis.contract_text,
        overall_risk=payload["overall_risk"],
        safety_score=payload["safety_score"],
        safety_score_explanation=payload["safety_score_explanation"],
        contract_type=payload["contract_type"],
        summary=payload["summary"],
        clauses=[ClauseResult(**clause) for clause in payload.get("clauses", [])],
    )


@router.post("/analyze", response_model=AnalysisDetail, status_code=status.HTTP_201_CREATED)
async def analyze_contract(
    request: Request,
    contract_text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    text = await _get_contract_text(request, contract_text, file)
    result = _call_llm(text)

    try:
        analysis = Analysis(
            contract_text=text,
            result_json=result.model_dump_json(),
            safety_score=result.safety_score,
            contract_type=result.contract_type,
        )
        db.add(analysis)
        db.flush()

        for clause in result.clauses:
            db.add(
                RiskClause(
                    analysis_id=analysis.id,
                    clause_text=clause.clause_text,
                    risk_level=clause.risk_level,
                    explanation=clause.explanation,
                    suggestion=clause.suggestion,
                )
            )

        db.commit()
        db.refresh(analysis)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database save failed: {exc}") from exc

    return _serialize_analysis(analysis)


@router.get("/analyses", response_model=list[AnalysisListItem])
def list_analyses(db: Session = Depends(get_db)):
    try:
        analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database read failed: {exc}") from exc

    return [
        AnalysisListItem(id=item.id, created_at=item.created_at, preview=item.contract_text[:100])
        for item in analyses
    ]


@router.get("/analyses/{analysis_id}", response_model=AnalysisDetail)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database read failed: {exc}") from exc

    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return _serialize_analysis(analysis)


@router.delete("/analyses/{analysis_id}", response_model=DeleteResponse)
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
        db.delete(analysis)
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database delete failed: {exc}") from exc

    return DeleteResponse(detail="Analysis deleted")


@router.post("/analyses/{analysis_id}/ask", response_model=AskResponse)
async def ask_about_analysis(analysis_id: int, payload: AskRequest, db: Session = Depends(get_db)):
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database read failed: {exc}") from exc

    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

    answer = _ask_llm(analysis.contract_text, analysis.result_json, question)
    return AskResponse(answer=answer)
