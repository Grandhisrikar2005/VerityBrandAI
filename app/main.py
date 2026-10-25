
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import AuditRequest, AuditResponse
from app.audit_engine import audit_content
from app.gemini_service import explain_audit_findings

app = FastAPI(
    title="VerityBrand AI",
    description="AI-powered brand governance and content auditing",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Temporary in-memory store for explanations.
# Suitable for local development; use a database for production.
explanation_jobs: dict[str, dict] = {}


@app.get("/")
def home():
    return {"message": "Welcome to VerityBrand AI", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


def generate_explanations(job_id: str, request: AuditRequest, findings: list):
    try:
        payload = [
            {
                "id": f.id,
                "category": f.category,
                "severity": f.severity,
                "excerpt": f.excerpt,
                "message": f.message,
                "evidence": f.evidence,
                "suggested_fix": f.suggested_fix,
            }
            for f in findings
        ]

        explanations = explain_audit_findings(
            brand_name=request.brand.brand_name,
            content=request.content,
            findings=payload,
        )

        explanation_jobs[job_id] = {
            "status": "complete",
            "explanations": explanations,
        }
    except Exception as error:
        print(f"Gemini explanation failed: {type(error).__name__}")
        explanation_jobs[job_id] = {
            "status": "failed",
            "explanations": {},
        }


@app.post("/api/v1/audits", response_model=AuditResponse)
def create_audit(request: AuditRequest, background_tasks: BackgroundTasks):
    result = audit_content(request)

    if result.findings:
        # Use a unique ID for this audit's explanation job.
        import uuid
        job_id = str(uuid.uuid4())

        explanation_jobs[job_id] = {
            "status": "pending",
            "explanations": {},
        }

        background_tasks.add_task(
            generate_explanations,
            job_id,
            request,
            list(result.findings),
        )

        # Return the job ID in a response header.
        # The frontend can poll the explanations endpoint.
        from fastapi.responses import JSONResponse

        response_data = result.model_dump()
        return JSONResponse(
            content=response_data,
            headers={"X-Explanation-Job-ID": job_id},
        )

    return result


@app.get("/api/v1/audits/{job_id}/explanations")
def get_explanations(job_id: str):
    job = explanation_jobs.get(job_id)

    if job is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Explanation job not found")

    return job
