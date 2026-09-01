"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Command,
  Copy,
  FileCheck2,
  FolderKanban,
  Gauge,
  History,
  Inbox,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SessionView = {
  revision: number;
  status: string;
  expiresAt: string;
  launchCount: number;
  maxLaunches: number;
  costCapUsd: number;
  project: {
    name: string;
    objective: string;
    deadline: string;
    constraints: string[];
    tasks: Array<{ id: string; title: string; status: "COMPLETED" | "BLOCKED" }>;
  };
  policy: { riskCeiling: string; permissions: string[]; deniedCapabilities: string[] };
  plan: null | {
    version: number;
    phases: Array<{ name: string; tasks: string[] }>;
    budgetUsd: number;
    requiredEvidence: string[];
  };
  run: null | {
    id: string;
    state: string;
    currentStep: string;
    costUsd: number;
    costTruth: string;
    artifactRefs: string[];
  };
  decision: null | {
    id: string;
    status: "PENDING" | "APPROVED" | "DENIED";
    prompt: string;
    selectedChoice: "staged_release" | "postpone" | null;
    choices: Array<{ id: "staged_release" | "postpone"; label: string; consequence: string }>;
  };
  evidence: null | {
    packHash: string;
    checks: Array<{ id: string; label: string; status: "PASS" | "FAIL" }>;
    artifactRefs: string[];
  };
  delivery: null | {
    readyForAcceptance: boolean;
    acceptedEvidenceHash: string | null;
    certificate: null | { certificateHash: string };
  };
  artifacts: Record<string, { name: string; mediaType: string; sha256: string }>;
  events: Array<{ id: string; at: string; actor: string; kind: string; summary: string }>;
  planHandle: string | null;
  runHandle: string | null;
  decisionRef: string | null;
  acceptanceToken: string | null;
};

type SessionResponse = { ok: boolean; session?: SessionView; errorCode?: string };

const judgePrompt =
  "Inspect Project Aurora, prepare a safe release mission, delegate the work, stop for any required human decision, and verify the final delivery. Do not bypass approvals or modify production.";

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard, active: false, attention: false },
  { label: "Projects", href: "#project", icon: FolderKanban, active: true, attention: false },
  { label: "Missions", href: "#mission", icon: Target, active: false, attention: false },
  { label: "Tasks", href: "#tasks", icon: ListChecks, active: false, attention: false },
  { label: "Decisions", href: "#decisions", icon: Inbox, active: false, attention: true },
  { label: "Approvals", href: "#decisions", icon: ShieldCheck, active: false, attention: false },
  { label: "Runs", href: "#mission", icon: Activity, active: false, attention: false },
  { label: "Team", href: "#policy", icon: Users, active: false, attention: false },
  { label: "History", href: "#mission", icon: History, active: false, attention: false },
] as const;

function relativeDeadline(deadline: string): string {
  const hours = Math.max(0, Math.round((Date.parse(deadline) - Date.now()) / 3_600_000));
  return `${hours} hours remaining`;
}

function shortHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function actorLabel(actor: string): string {
  return (
    {
      arcadeops: "ArcadeOps",
      browser_agent: "Browser operator",
      worker: "Release worker",
      human: "Human reviewer",
    }[actor] || actor.replaceAll("_", " ")
  );
}

export function RelayDashboard() {
  const [session, setSession] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webMcp, setWebMcp] = useState({ connected: false, count: 0 });
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/session", { cache: "no-store" });
      const data = (await response.json()) as SessionResponse;
      if (!data.ok || !data.session) throw new Error(data.errorCode || "SESSION_UNAVAILABLE");
      setSession(data.session);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "SESSION_UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const status = (event: Event) => {
      const detail = (event as CustomEvent<{ connected: boolean; count: number }>).detail;
      setWebMcp(detail);
    };
    const changed = () => void load();
    window.addEventListener("relay:webmcp-status", status);
    window.addEventListener("relay:state-changed", changed);
    if (document.modelContext) setWebMcp({ connected: true, count: 7 });
    return () => {
      window.removeEventListener("relay:webmcp-status", status);
      window.removeEventListener("relay:state-changed", changed);
    };
  }, [load]);

  async function resetDemo() {
    setBusy("reset");
    setError(null);
    try {
      const response = await fetch("/api/session", { method: "POST" });
      const data = (await response.json()) as SessionResponse;
      if (!data.ok || !data.session) throw new Error(data.errorCode || "RESET_REFUSED");
      setSession(data.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "RESET_REFUSED");
    } finally {
      setBusy(null);
    }
  }

  async function humanAction(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setError(null);
    try {
      const response = await fetch("/api/human", {
        method: "POST",
        headers: { "content-type": "application/json", "x-relay-human-action": "visible-ui" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as SessionResponse;
      if (!data.ok || !data.session) throw new Error(data.errorCode || "HUMAN_ACTION_REFUSED");
      setSession(data.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "HUMAN_ACTION_REFUSED");
    } finally {
      setBusy(null);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(judgePrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) {
    return (
      <main className="loading-shell" aria-busy="true">
        <div className="loading-rail" />
        <div className="loading-workspace">
          <div className="loading-block" />
          <div className="loading-grid"><div /><div /></div>
        </div>
        <span className="sr-only">Creating an isolated Project Aurora workspace</span>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="error-page">
        <h1>Judge workspace unavailable</h1>
        <p>{error || "The isolated session could not be created."}</p>
        <button className="button button-primary" onClick={() => void load()} type="button">Retry</button>
      </main>
    );
  }

  const pendingDecision = session.decision?.status === "PENDING";
  const accepted = session.status === "ACCEPTED";
  const completedTasks = session.project.tasks.filter((task) => task.status === "COMPLETED").length;

  return (
    <main className="operations-shell" id="overview">
      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">AO</span>
          <div><strong>ArcadeOps</strong><span>Relay workspace</span></div>
        </div>
        <nav className="business-nav" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon, active, attention }) => (
            <a className={active ? "active" : ""} href={href} key={label}>
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {attention && pendingDecision ? <span className="nav-count" aria-label="1 pending decision">1</span> : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck aria-hidden="true" size={16} />
          <div><strong>Challenge workspace</strong><span>Synthetic data only</span></div>
        </div>
      </aside>

      <div className="workspace-shell">
        <header className="topbar">
          <div className="breadcrumbs" aria-label="Breadcrumb">
            <span>Projects</span><ChevronRight aria-hidden="true" size={14} /><strong>{session.project.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`connection ${webMcp.connected ? "connected" : "fallback"}`} role="status">
              <span aria-hidden="true" className="connection-dot" />
              {webMcp.connected ? `WebMCP connected · ${webMcp.count} tools` : "WebMCP unavailable · human view works"}
            </span>
            <button className="button button-primary" disabled={busy !== null} onClick={() => void resetDemo()} type="button">
              <RotateCcw aria-hidden="true" size={15} />
              {busy === "reset" ? "Starting…" : "Start judge demo"}
            </button>
          </div>
        </header>

        <div className="workspace-content">
          <section className="project-header" id="project">
            <span className="section-label">PROJECT</span>
            <div className="title-line"><h1>{session.project.name}</h1><span className="state-label state-review">Release review</span></div>
            <p>{session.project.objective}</p>
            <div className="project-meta">
              <span><Clock3 aria-hidden="true" size={14} /> Due tomorrow</span>
              <span>Revision {session.revision}</span>
              <span>Session expires {new Date(session.expiresAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </section>

          <nav className="project-tabs" aria-label="Project sections">
            <a className="active" href="#overview">Summary</a><a href="#mission">Missions</a><a href="#tasks">Tasks</a>
            <a href="#decisions">Decisions</a><a href="#evidence">Deliverables</a><a href="#mission">Activity</a><a href="#policy">Settings</a>
          </nav>

          {error ? <div className="error-banner" role="alert">Request refused: {error}. Refresh the current state before retrying.</div> : null}

          <section className="attention-strip" aria-label="Operational summary">
            <div><Inbox aria-hidden="true" size={17} /><span>Needs attention</span><strong>{pendingDecision ? "1 decision" : "Nothing pending"}</strong></div>
            <div><Activity aria-hidden="true" size={17} /><span>Mission</span><strong>{session.run?.state || "Not started"}</strong></div>
            <div><ListChecks aria-hidden="true" size={17} /><span>Readiness</span><strong>{completedTasks}/{session.project.tasks.length} tasks</strong></div>
            <div><Gauge aria-hidden="true" size={17} /><span>Execution cost</span><strong>${session.run?.costUsd.toFixed(3) || "0.000"} / ${session.costCapUsd.toFixed(2)}</strong></div>
          </section>

          <section className="instruction-bar" aria-labelledby="browser-instruction-title">
            <Command aria-hidden="true" size={18} />
            <div><span className="section-label" id="browser-instruction-title">BROWSER INSTRUCTION</span><p>{judgePrompt}</p></div>
            <button className="button button-tertiary" onClick={() => void copyPrompt()} type="button">
              {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}{copied ? "Copied" : "Copy instruction"}
            </button>
          </section>

          <div className="content-grid">
            <div className="primary-column">
              <section className="workspace-section" id="tasks" aria-labelledby="readiness-title">
                <div className="section-heading">
                  <div><span className="section-label">PROJECT STATUS</span><h2 id="readiness-title">Release readiness</h2></div>
                  <span className="state-label state-warning"><Clock3 aria-hidden="true" size={13} /> {relativeDeadline(session.project.deadline)}</span>
                </div>

                <div className="project-brief-grid">
                  <div>
                    <h3>Operating constraints</h3>
                    <ul className="constraint-list">
                      {session.project.constraints.map((constraint) => <li key={constraint}><ShieldCheck aria-hidden="true" size={14} />{constraint}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3>Readiness checklist</h3>
                    <div className="task-list">
                      {session.project.tasks.map((task) => (
                        <div className="task-row" key={task.id}>
                          {task.status === "COMPLETED" ? <CheckCircle2 aria-hidden="true" className="task-pass" size={17} /> : <CircleAlert aria-hidden="true" className="task-blocked" size={17} />}
                          <span>{task.title}</span><span className={`state-label ${task.status === "COMPLETED" ? "state-pass" : "state-warning"}`}>{task.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="plan-block">
                  <div className="section-heading compact">
                    <div><span className="section-label">MISSION PREPARATION</span><h3>{session.plan ? `Mission plan · v${session.plan.version}` : "Mission plan"}</h3></div>
                    {session.plan ? <span className="state-label state-info">Prepared automatically</span> : null}
                  </div>
                  {session.plan ? (
                    <>
                      <ol className="phase-list">{session.plan.phases.map((phase) => <li key={phase.name}><strong>{phase.name}</strong><span>{phase.tasks.join(" · ")}</span></li>)}</ol>
                      <p className="detail-line">Budget ${session.plan.budgetUsd.toFixed(3)} · {session.plan.requiredEvidence.length} required evidence checks · Human decision anticipated</p>
                    </>
                  ) : <p className="empty-copy">No mission has been prepared. The browser operator can draft one from this project context.</p>}
                </div>
              </section>

              <section className="workspace-section" id="mission" aria-labelledby="timeline-title">
                <div className="section-heading">
                  <div><span className="section-label">EXECUTION JOURNAL</span><h2 id="timeline-title">Mission execution</h2></div>
                  {session.run ? <span className={`state-label ${session.run.state === "COMPLETED" ? "state-pass" : "state-live"}`}>{session.run.state}</span> : <span className="state-label">Not started</span>}
                </div>
                {session.run ? <div className="run-summary"><div><span>Current step</span><strong>{session.run.currentStep}</strong></div><div><span>Cost truth</span><strong>${session.run.costUsd.toFixed(3)} · complete</strong></div></div> : null}
                <ol className="timeline">
                  {session.events.map((entry) => (
                    <li key={entry.id}>
                      <span className={`timeline-node actor-${entry.actor}`} aria-hidden="true" />
                      <div>
                        <div className="event-meta"><strong>{actorLabel(entry.actor)}</strong><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></div>
                        <p>{entry.summary}</p><span className="event-kind">{entry.kind === "HUMAN_DECISION_REQUIRED" ? "authority gate opened" : entry.kind.replaceAll("_", " ")}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                {session.events.length === 1 ? <p className="empty-copy">Send the browser instruction above to begin the mission.</p> : null}
              </section>
            </div>

            <aside className="context-column" aria-label="Attention and proof">
              <section className="workspace-section attention-panel" id="decisions" aria-labelledby="attention-title">
                <div className="section-heading">
                  <div><span className="section-label">TO REVIEW</span><h2 id="attention-title">Attention</h2></div>
                  {pendingDecision ? <span className="state-label state-warning">1 open</span> : <span className="state-label state-pass">Clear</span>}
                </div>
                {pendingDecision && session.decisionRef ? (
                  <section className="decision-card" aria-labelledby="decision-title">
                    <span className="decision-type"><CircleAlert aria-hidden="true" size={15} /> Human decision required</span>
                    <h3 id="decision-title">{session.decision?.prompt}</h3>
                    <p>The release worker is paused. This control is reserved for a person and is never exposed to browser automation.</p>
                    {session.decision?.choices.map((choice) => (
                      <button className={`choice ${choice.id === "staged_release" ? "choice-primary" : ""}`} disabled={busy !== null} key={choice.id} onClick={() => void humanAction({ action: "choose_release", decisionRef: session.decisionRef, choice: choice.id }, choice.id)} type="button">
                        <strong>{choice.label}</strong><span>{choice.consequence}</span>
                      </button>
                    ))}
                  </section>
                ) : session.decision ? (
                  <div className={`decision-result ${session.decision.status === "APPROVED" ? "approved" : "denied"}`}><div><CheckCircle2 aria-hidden="true" size={17} /><strong>Human decision recorded</strong></div><span>{session.decision.selectedChoice?.replaceAll("_", " ")}</span></div>
                ) : <p className="empty-copy">No human decision is pending.</p>}
              </section>

              <section className="workspace-section" id="evidence" aria-labelledby="evidence-title">
                <div className="section-heading"><div><span className="section-label">DELIVERY CONTROL</span><h2 id="evidence-title">Evidence checklist</h2></div>{session.evidence ? <span className="state-label state-pass">Evaluated</span> : null}</div>
                {session.evidence ? (
                  <>
                    <ul className="evidence-list">{session.evidence.checks.map((check) => <li key={check.id}><Check aria-hidden="true" size={14} /><span>{check.label}</span><strong>{check.status}</strong></li>)}</ul>
                    <div className="hash-row"><span>Evidence-pack hash</span><code title={session.evidence.packHash}>{shortHash(session.evidence.packHash)}</code></div>
                    <div className="artifact-links">{session.evidence.artifactRefs.map((id) => <a href={`/api/artifacts/${encodeURIComponent(id)}`} key={id} rel="noreferrer" target="_blank"><FileCheck2 aria-hidden="true" size={13} />{session.artifacts[id]?.name || id}</a>)}</div>
                  </>
                ) : <p className="empty-copy">Completion is not verification. Required evidence will appear after the worker finishes.</p>}

                {session.delivery?.readyForAcceptance && !session.delivery.certificate && session.acceptanceToken && session.evidence ? (
                  <button className="button button-primary button-full" disabled={busy !== null} onClick={() => void humanAction({ action: "accept_delivery", acceptanceToken: session.acceptanceToken, evidencePackHash: session.evidence?.packHash }, "accept")} type="button">
                    {busy === "accept" ? "Issuing certificate…" : "Accept this exact evidence pack"}
                  </button>
                ) : null}

                <div className={`certificate-row ${accepted ? "certificate-valid" : ""}`}>
                  <div><ShieldCheck aria-hidden="true" size={17} /><strong>Release certificate</strong></div><span className={`state-label ${accepted ? "state-pass" : ""}`}>{accepted ? "VALID" : "NOT ISSUED"}</span>
                  {session.delivery?.certificate ? <code title={session.delivery.certificate.certificateHash}>{shortHash(session.delivery.certificate.certificateHash)}</code> : <p>Issued after all checks pass and a person accepts the exact pack.</p>}
                </div>
              </section>

              <section className="workspace-section policy-panel" id="policy" aria-labelledby="policy-title">
                <div className="section-heading compact"><div><span className="section-label">ACTIVE POLICY</span><h2 id="policy-title">Operating boundary</h2></div><span className="state-label">{session.policy.riskCeiling}</span></div>
                <p>Automation may inspect, prepare, launch bounded work, observe, resume, and verify.</p><p><strong>Unavailable:</strong> {session.policy.deniedCapabilities.join(", ")}.</p>
              </section>
            </aside>
          </div>

          <footer><span>All demo data is synthetic · no production access · no external actions</span><span>{session.launchCount}/{session.maxLaunches} mission launches used</span></footer>
        </div>
      </div>
    </main>
  );
}
