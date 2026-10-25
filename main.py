
from fastapi import FastAPI

from app.schemas import AuditRequest, AuditResponse
from app.audit_engine import audit_content
from app.gemini_service import explain_audit_finding

app = FastAPI(
    title="VerityBrand AI",
    description="AI-powered brand governance and content auditing",
    version="0.2.0",
)


@app.get("/")
def home():
    return {
        "message": "Welcome to VerityBrand AI",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/v1/audits", response_model=AuditResponse)
def create_audit(request: AuditRequest):
    # Run the existing deterministic audit first.
    result = audit_content(request)

    # Add AI explanations without discarding the original findings.
    for finding in result.findings:
        try:
            finding.ai_explanation = explain_audit_finding(
                brand_name=request.brand.brand_name,
                content=request.content,
                finding_message=finding.message,
                brand_evidence=finding.evidence,
            )
        except Exception:
            # Preserve the original audit if the AI service is unavailable.
            finding.ai_explanation = None

    return result
