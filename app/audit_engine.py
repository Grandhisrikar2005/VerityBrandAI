
import re
from uuid import uuid4

from app.schemas import AuditRequest, AuditResponse, Finding


def contains_phrase(text: str, phrase: str) -> bool:
    """Check whether a phrase appears in text, ignoring case."""
    if not phrase.strip():
        return False

    pattern = r"(?<!\w)" + re.escape(phrase) + r"(?!\w)"
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def audit_content(request: AuditRequest) -> AuditResponse:
    content = request.content
    findings: list[Finding] = []

    # 1. Check explicit brand rules.
    for rule in request.brand.rules:
        for phrase in rule.prohibited_phrases:
            if contains_phrase(content, phrase):
                alternative = (
                    rule.approved_alternatives[0]
                    if rule.approved_alternatives
                    else None
                )

                findings.append(
                    Finding(
                        id=str(uuid4()),
                        category=rule.category,
                        severity=rule.severity,
                        excerpt=phrase,
                        message=(
                            f"'{phrase}' conflicts with brand rule "
                            f"{rule.id}: {rule.description}"
                        ),
                        evidence=(
                            f"Brand rule {rule.id}: {rule.description}"
                        ),
                        suggested_fix=alternative,
                        status="detected",
                    )
                )

        for phrase in rule.required_phrases:
            if not contains_phrase(content, phrase):
                findings.append(
                    Finding(
                        id=str(uuid4()),
                        category=rule.category,
                        severity=rule.severity,
                        excerpt=phrase,
                        message=f"Required phrase '{phrase}' is missing.",
                        evidence=(
                            f"Brand rule {rule.id}: {rule.description}"
                        ),
                        suggested_fix=(
                            f"Consider including '{phrase}' where appropriate."
                        ),
                        status="detected",
                    )
                )

    # 2. Flag potentially unsupported promotional claims.
    risky_patterns = [
        (
            r"\bguaranteed\s+\d+(?:\.\d+)?\s*%?\s*"
            r"(?:returns?|profits?|savings?)\b",
            "Potentially unsupported guaranteed financial claim",
        ),
        (
            r"\b(?:the\s+)?(?:best|cheapest|number\s+one|#1)\b",
            "Comparative or superlative claim needs evidence",
        ),
    ]

    for pattern, message in risky_patterns:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            findings.append(
                Finding(
                    id=str(uuid4()),
                    category="claim",
                    severity="high",
                    excerpt=match.group(0),
                    message=message,
                    evidence=(
                        "Supporting evidence has not been verified "
                        "by the baseline engine."
                    ),
                    suggested_fix=(
                        "Provide approved evidence or revise the claim."
                    ),
                    status="needs_review",
                )
            )

    # 3. Detect conflicting trial durations.
    for fact in request.brand.approved_facts:
        if fact.fact_type != "trial_duration":
            continue

        approved_match = re.search(
            r"\b(\d+)\s*[- ]?\s*days?\b",
            fact.approved_value or "",
            re.IGNORECASE,
        )

        if not approved_match:
            continue

        approved_days = int(approved_match.group(1))

        # Only inspect sentences that mention a trial.
        sentences = re.split(
            r"(?<=[.!?])\s+",
            content,
        )

        for sentence in sentences:
            if not re.search(r"\btrial\b", sentence, re.IGNORECASE):
                continue

            for match in re.finditer(
                r"\b(\d+)\s*[- ]?\s*days?\b",
                sentence,
                re.IGNORECASE,
            ):
                mentioned_days = int(match.group(1))

                if mentioned_days == approved_days:
                    continue

                findings.append(
                    Finding(
                        id=str(uuid4()),
                        category="fact",
                        severity="high",
                        excerpt=match.group(0),
                        message=(
                            f"The content mentions a {mentioned_days}-day "
                            f"trial, but the approved duration is "
                            f"{approved_days} days."
                        ),
                        evidence=(
                            f"Approved fact {fact.id}: {fact.statement}"
                        ),
                        suggested_fix=(
                            f"Verify and use the approved duration of "
                            f"{approved_days} days."
                        ),
                        status="needs_review",
                    )
                )

    return AuditResponse(
        brand_name=request.brand.brand_name,
        findings=findings,
        total_findings=len(findings),
        requires_human_review=any(
            finding.status == "needs_review"
            or finding.severity in {"high", "critical"}
            for finding in findings
        ),
    )
