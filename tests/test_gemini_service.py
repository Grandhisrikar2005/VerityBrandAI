
from app.gemini_service import explain_audit_finding


def test_gemini_explains_audit_finding():
    explanation = explain_audit_finding(
        brand_name="NovaPay",
        content="Get access free forever!",
        finding_message=(
            "'free forever' conflicts with RULE-001: "
            "The approved offer is a 14-day free trial."
        ),
        brand_evidence=(
            "RULE-001: Never describe the account as free forever. "
            "The approved offer is a 14-day free trial."
        ),
    )

    assert isinstance(explanation, str)
    assert len(explanation.strip()) > 20

    print("\nGemini explanation:\n", explanation)
