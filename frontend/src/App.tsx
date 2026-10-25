
import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Plus,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import './App.css'

type Finding = {
  id: string
  category: string
  severity: string
  excerpt: string
  message: string
  evidence?: string | null
  suggested_fix?: string | null
  status: 'detected' | 'needs_review'
  ai_explanation?: string | null
}

type AuditResponse = {
  brand_name: string
  findings: Finding[]
  total_findings: number
  requires_human_review: boolean
}

const sampleContent =
  'NovaPay makes managing money simple. Get access free forever! Sign up today for guaranteed 50% savings. Our unbeatable deal gives you a 30-day free trial.'

const sampleBrand = {
  brand_name: 'NovaPay',
  rules: [
    {
      id: 'RULE-001',
      category: 'terminology',
      description:
        'Never describe the account as free forever. The approved offer is a 14-day free trial.',
      severity: 'high',
      prohibited_phrases: ['free forever'],
      required_phrases: [],
      approved_alternatives: ['Start your 14-day free trial'],
    },
    {
      id: 'RULE-002',
      category: 'tone',
      description: 'Avoid exaggerated promotional language.',
      severity: 'medium',
      prohibited_phrases: ['unbeatable deal'],
      required_phrases: [],
      approved_alternatives: ['Explore our available plans'],
    },
  ],
  approved_facts: [
    {
      id: 'FACT-001',
      statement: 'NovaPay offers a 14-day free trial.',
      keywords: ['free trial'],
      fact_type: 'trial_duration',
      approved_value: '14 days',
    },
  ],
}

function App() {
  // Start empty: users provide their own content.
  const [content, setContent] = useState('')
  const [result, setResult] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function runAudit() {
    if (!content.trim()) {
      setError('Enter some content before running an audit.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          brand: sampleBrand,
        }),
      })

      if (!response.ok) {
        let detail = `Audit request failed (${response.status}).`

        try {
          const body = await response.json()
          if (body.detail) {
            detail =
              typeof body.detail === 'string'
                ? body.detail
                : JSON.stringify(body.detail)
          }
        } catch {
          // Keep the fallback error message.
        }

        throw new Error(detail)
      }

      const data: AuditResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Check that the FastAPI backend is running.`
          : 'Unable to run the audit.',
      )
    } finally {
      setLoading(false)
    }
  }

  function loadSample() {
    setContent(sampleContent)
    setResult(null)
    setError('')
  }

  function clearContent() {
    setContent('')
    setResult(null)
    setError('')
  }

  function applySuggestion(finding: Finding) {
    if (!finding.suggested_fix) return

    setContent((current) => {
      if (
        finding.excerpt &&
        current.toLowerCase().includes(finding.excerpt.toLowerCase())
      ) {
        const escapedExcerpt = finding.excerpt.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        )

        return current.replace(
          new RegExp(escapedExcerpt, 'i'),
          finding.suggested_fix!,
        )
      }

      return `${current}\n${finding.suggested_fix}`
    })

    // The old results refer to the previous text.
    setResult(null)
    setError('')
  }

  const highCount =
    result?.findings.filter(
      (finding) =>
        finding.severity === 'high' || finding.severity === 'critical',
    ).length ?? 0

  const reviewCount =
    result?.findings.filter(
      (finding) => finding.status === 'needs_review',
    ).length ?? 0

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="brand-name">veritybrand</div>
            <div className="brand-subtitle">AI GOVERNANCE</div>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <XCircle size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher">
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy">
            <strong>NovaPay</strong>
            <span>Brand workspace</span>
          </div>
          <ChevronDown size={16} />
        </button>

        <div className="nav-section-label">PLATFORM</div>
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <LayoutDashboard size={18} />
            <span>Overview &amp; audit</span>
          </button>
          <button
            className="nav-item"
            onClick={() => document.getElementById('content-editor')?.focus()}
          >
            <FileText size={18} />
            <span>Content review</span>
          </button>
          <button
            className="nav-item"
            onClick={runAudit}
            disabled={loading || !content.trim()}
          >
            <ScanSearch size={18} />
            <span>Run an audit</span>
          </button>
        </nav>

        <div className="nav-section-label">MANAGEMENT</div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={loadSample}>
            <BadgeCheck size={18} />
            <span>Brand guidelines</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              setResult(null)
              setError('')
            }}
          >
            <Clock3 size={18} />
            <span>Audit history</span>
          </button>
          <button
            className="nav-item"
            onClick={() => setError('Settings are not configured in this MVP yet.')}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="trust-card">
          <div className="trust-icon">
            <LockKeyhole size={17} />
          </div>
          <strong>Govern with confidence</strong>
          <p>Evidence-backed reviews. Human-led decisions.</p>
          <span>
            <span className="online-dot" /> Audit engine ready
          </span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">VB</div>
          <div className="profile-copy">
            <strong>Brand team</strong>
            <span>Workspace member</span>
          </div>
          <CircleHelp size={18} />
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview &amp; audit</strong>
          </div>
          <div className="topbar-right">
            <div className="connection-status">
              <span className="online-dot" /> AI services configured
            </div>
            <div className="topbar-avatar">N</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <Sparkles size={14} /> BRAND INTELLIGENCE
              </div>
              <h1>Content audit workspace</h1>
              <p>Keep every message aligned with your brand standards.</p>
            </div>
            <button className="secondary-button" onClick={loadSample}>
              <Plus size={16} /> Load sample
            </button>
          </section>

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-top">
                <span>Total findings</span>
                <div className="metric-icon purple">
                  <ScanSearch size={18} />
                </div>
              </div>
              <div className="metric-value">{result?.total_findings ?? '—'}</div>
              <div className="metric-foot">Issues found in this audit</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>High priority</span>
                <div className="metric-icon red">
                  <TriangleAlert size={18} />
                </div>
              </div>
              <div className="metric-value">{result ? highCount : '—'}</div>
              <div className="metric-foot">High and critical severity</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Needs review</span>
                <div className="metric-icon amber">
                  <Clock3 size={18} />
                </div>
              </div>
              <div className="metric-value">{result ? reviewCount : '—'}</div>
              <div className="metric-foot">Requires human verification</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Review status</span>
                <div className="metric-icon green">
                  <Activity size={18} />
                </div>
              </div>
              <div className="metric-value status-value">
                {result
                  ? result.requires_human_review
                    ? 'Review'
                    : 'Clear'
                  : 'Ready'}
              </div>
              <div className="metric-foot">Final decisions stay human-led</div>
            </article>
          </section>

          <section className="audit-layout">
            <article className="panel editor-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">01 / INPUT</div>
                  <h2>Review your content</h2>
                  <p>
                    Enter your own copy to check it against the active NovaPay
                    guidelines.
                  </p>
                </div>
                <div className="document-icon">
                  <FileText size={19} />
                </div>
              </div>

              <label className="field-label" htmlFor="content-editor">
                CONTENT TO AUDIT
              </label>
              <textarea
                id="content-editor"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value)
                  setResult(null)
                  setError('')
                }}
                placeholder="Paste or type your marketing copy here..."
                maxLength={50000}
              />

              <div className="editor-meta">
                <span>{content.length.toLocaleString()} / 50,000 characters</span>
                <span>
                  Brand: <strong>NovaPay</strong>
                </span>
              </div>

              <div className="guidelines-box">
                <div className="guidelines-heading">
                  <ShieldCheck size={17} />
                  <strong>Active brand policies</strong>
                </div>
                <div className="policy-row">
                  <span className="policy-dot red-dot" />
                  No “free forever” claims
                </div>
                <div className="policy-row">
                  <span className="policy-dot amber-dot" />
                  Avoid exaggerated promotional language
                </div>
                <div className="policy-row">
                  <span className="policy-dot blue-dot" />
                  Trial duration must match approved facts
                </div>
              </div>

              <button
                className="primary-button"
                onClick={runAudit}
                disabled={loading || !content.trim()}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Auditing content...
                  </>
                ) : (
                  <>
                    Run brand audit <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="editor-actions">
                <button
                  className="text-button"
                  onClick={clearContent}
                  disabled={loading || (!content && !result && !error)}
                >
                  Clear content
                </button>
              </div>

              <div className="privacy-note">
                <LockKeyhole size={13} />
                Submitted content is sent to your configured audit backend.
              </div>
            </article>

            <article className="panel results-panel">
              <div className="panel-heading results-heading">
                <div>
                  <div className="panel-kicker">02 / ANALYSIS</div>
                  <h2>Audit findings</h2>
                  <p>
                    {result
                      ? `${result.total_findings} finding${result.total_findings === 1 ? '' : 's'} returned`
                      : 'Evidence-backed issues and recommendations.'}
                  </p>
                </div>
                <div className="results-symbol">
                  <ScanSearch size={21} />
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <TriangleAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <ScanSearch size={30} />
                  </div>
                  <h3>{content.trim() ? 'Ready to audit' : 'Start with your content'}</h3>
                  <p>
                    {content.trim()
                      ? 'Your text is ready. Run an audit to see brand issues, evidence, and AI-powered recommendations.'
                      : 'Paste your own marketing copy into the editor, or load sample content to explore the audit workflow.'}
                  </p>
                  <button
                    className="text-button"
                    onClick={content.trim() ? runAudit : loadSample}
                    disabled={loading}
                  >
                    {content.trim() ? 'Run an audit' : 'Try sample content'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {loading && (
                <div className="loading-state">
                  <LoaderCircle className="spin" size={30} />
                  <strong>Analyzing your content</strong>
                  <p>
                    Checking brand rules and generating explanations. This may
                    take a little while.
                  </p>
                </div>
              )}

              {result && result.findings.length === 0 && (
                <div className="empty-state clean-state">
                  <div className="empty-illustration clean">
                    <CheckCircle2 size={30} />
                  </div>
                  <h3>No issues detected</h3>
                  <p>
                    No configured rules were triggered. This does not guarantee
                    that every claim is accurate or compliant.
                  </p>
                </div>
              )}

              {result && result.findings.length > 0 && (
                <div className="findings-list">
                  {result.findings.map((finding, index) => (
                    <section className="finding-card" key={finding.id}>
                      <div className="finding-card-top">
                        <span className="finding-number">
                          FINDING {String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`severity severity-${finding.severity.toLowerCase()}`}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      <span className="category-label">
                        {finding.category.replaceAll('_', ' ')}
                      </span>

                      <blockquote className="finding-excerpt">
                        “{finding.excerpt}”
                      </blockquote>

                      <p className="finding-message">{finding.message}</p>

                      {finding.evidence && (
                        <div className="evidence-block">
                          <strong>
                            <ShieldCheck size={14} /> Brand evidence
                          </strong>
                          <p>{finding.evidence}</p>
                        </div>
                      )}

                      {finding.ai_explanation && (
                        <div className="ai-block">
                          <strong>
                            <Sparkles size={14} /> Gemini explanation
                          </strong>
                          <p>{finding.ai_explanation}</p>
                        </div>
                      )}

                      {finding.suggested_fix && (
                        <div className="suggestion-block">
                          <strong>Suggested correction</strong>
                          <p>{finding.suggested_fix}</p>
                          <button
                            className="text-button"
                            onClick={() => applySuggestion(finding)}
                          >
                            Apply suggestion <ArrowRight size={14} />
                          </button>
                        </div>
                      )}

                      {finding.status === 'needs_review' && (
                        <div className="review-note">
                          <Clock3 size={14} /> Human verification required
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}

              {result && (
                <div className="results-footer">
                  <ShieldCheck size={16} />
                  AI findings support review; human approval remains essential.
                </div>
              )}
            </article>
          </section>

          <footer className="page-footer">
            <span>
              VerityBrand AI <span className="footer-separator">/</span> Brand
              governance workspace
            </span>
            <span>
              <span className="online-dot" /> Audit service interface
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
