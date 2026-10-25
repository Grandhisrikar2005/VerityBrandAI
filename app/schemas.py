
from typing import Literal

from pydantic import BaseModel, Field


class BrandRule(BaseModel):
    id: str
    category: Literal[
        "terminology",
        "tone",
        "claim",
        "fact",
        "accessibility",
        "visual",
    ]
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    prohibited_phrases: list[str] = Field(default_factory=list)
    required_phrases: list[str] = Field(default_factory=list)
    approved_alternatives: list[str] = Field(default_factory=list)


class ApprovedFact(BaseModel):
    id: str
    statement: str
    keywords: list[str] = Field(default_factory=list)
    fact_type: Literal[
        "general",
        "trial_duration",
        "price",
        "product_limit",
    ] = "general"
    approved_value: str | None = None


class BrandProfile(BaseModel):
    brand_name: str
    rules: list[BrandRule] = Field(default_factory=list)
    approved_facts: list[ApprovedFact] = Field(default_factory=list)


class AuditRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50000)
    brand: BrandProfile


class Finding(BaseModel):
    id: str
    category: str
    severity: str
    excerpt: str
    message: str
    evidence: str | None = None
    suggested_fix: str | None = None
    status: Literal["detected", "needs_review"] = "detected"
    ai_explanation: str | None = None


class AuditResponse(BaseModel):
    brand_name: str
    findings: list[Finding]
    total_findings: int
    requires_human_review: bool
