
from app.schemas import (
    AuditRequest,
    ApprovedFact,
    BrandProfile,
    BrandRule,
)
from app.audit_engine import audit_content


def test_prohibited_phrase_is_detected():
    brand = BrandProfile(
        brand_name="TestBrand",
        rules=[
            BrandRule(
                id="R1",
                category="terminology",
                description="Do not promise free access forever.",
                severity="high",
                prohibited_phrases=["free forever"],
                approved_alternatives=["Try our free trial"],
            )
        ],
    )

    request = AuditRequest(
        content="Get access free forever!",
        brand=brand,
    )

    result = audit_content(request)

    assert any(
        finding.category == "terminology"
        and finding.excerpt == "free forever"
        for finding in result.findings
    )


def test_clean_content_has_no_findings():
    request = AuditRequest(
        content="Explore our available plans today.",
        brand=BrandProfile(brand_name="TestBrand"),
    )

    result = audit_content(request)

    assert result.total_findings == 0


def test_guaranteed_returns_requires_review():
    request = AuditRequest(
        content="Get guaranteed 50% returns.",
        brand=BrandProfile(brand_name="TestBrand"),
    )

    result = audit_content(request)

    assert any(
        finding.category == "claim"
        and finding.status == "needs_review"
        for finding in result.findings
    )


def test_conflicting_trial_duration_is_flagged():
    brand = BrandProfile(
        brand_name="NovaPay",
        approved_facts=[
            ApprovedFact(
                id="FACT-001",
                statement="NovaPay offers a 14-day free trial.",
                keywords=["free trial"],
                fact_type="trial_duration",
                approved_value="14 days",
            )
        ],
    )

    request = AuditRequest(
        content="NovaPay offers a 30-day trial.",
        brand=brand,
    )

    result = audit_content(request)

    assert any(
        finding.category == "fact"
        and "30-day" in finding.excerpt
        and finding.status == "needs_review"
        for finding in result.findings
    )
