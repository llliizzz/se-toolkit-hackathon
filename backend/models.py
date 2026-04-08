from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Analysis(Base):
    __tablename__ = "analyses"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    contract_text = Column(Text, nullable=False)
    result_json = Column(Text, nullable=False)
    safety_score = Column(Integer, nullable=True)
    contract_type = Column(String(64), nullable=True)
    risk_clauses = relationship(
        "RiskClause",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )
    chat_messages = relationship(
        "ChatMessage",
        back_populates="analysis",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


class RiskClause(Base):
    __tablename__ = "risk_clauses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    clause_text = Column(Text, nullable=False)
    risk_level = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="risk_clauses")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="chat_messages")
