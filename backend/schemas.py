from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel

RiskLevel = Literal["high", "medium", "low"]
ContractType = Literal[
    "NDA",
    "Freelance Agreement",
    "Rental Agreement",
    "Employment Contract",
    "Service Agreement",
    "Other",
]


class AnalyzeRequest(BaseModel):
    contract_text: str


class ClauseResult(BaseModel):
    clause_text: str
    risk_level: RiskLevel
    explanation: str
    suggestion: str


class AnalysisResult(BaseModel):
    overall_risk: RiskLevel
    safety_score: int
    safety_score_explanation: str
    contract_type: ContractType
    summary: str
    clauses: List[ClauseResult]


class AnalysisListItem(BaseModel):
    id: int
    created_at: datetime
    preview: str

    class Config:
        from_attributes = True


class AnalysisDetail(BaseModel):
    id: int
    created_at: datetime
    contract_text: str
    overall_risk: RiskLevel
    safety_score: int
    safety_score_explanation: str
    contract_type: ContractType
    summary: str
    clauses: List[ClauseResult]

    class Config:
        from_attributes = True


class DeleteResponse(BaseModel):
    detail: str


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


class ErrorResponse(BaseModel):
    detail: str
