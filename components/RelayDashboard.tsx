"use client";

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
  policy: {
    riskCeiling: string;
    permissions: string[];
    deniedCapabilities: string[];
  };
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

function relativeDeadline(deadline: string): string {
  const hours = Math.max(0, Math.round((Date.parse(deadline) - Date.now()) / 3_600_000));
  return `${hours} hours remaining`;
}

function shortHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
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
        <div className="loading-block" />
        <div className="loading-grid"><div /><div /><div /></div>
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

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">ARCADEOPS RELAY · WEBMCP CHALLENGE</div>
          <h1>Browser agents delegate. Humans decide. Evidence proves.</h1>
          <p className="hero-copy">
            One live Project Aurora state shared by the browser agent, a bounded worker, and the human authority gate.
          </p>
        </div>
        <div className="hero-actions">
          <span className={`connection ${webMcp.connected ? "connected" : "fallback"}`} role="status">
            <span aria-hidden="true" className="connection-dot" />
            {webMcp.connected ? `WebMCP connected · ${webMcp.count} tools` : "WebMCP unavailable · human view works"}
          </span>
          <button className="button button-primary" disabled={busy !== null} onClick={() => void resetDemo()} type="button">
            {busy === "reset" ? "Starting…" : "Start judge demo"}
          </button>
        </div>
      </header>

      <section className="prompt-card" aria-labelledby="judge-prompt-title">
        <div>
          <span className="eyebrow" id="judge-prompt-title">TRY THIS PROMPT</span>
          <p>{judgePrompt}</p>
        </div>
        <button className="button button-secondary" onClick={() => void copyPrompt()} type="button">
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </section>

      {error ? <div className="error-banner" role="alert">Request refused: {error}. Refresh the current state before retrying.</div> : null}

      <section className="truth-strip" aria-label="Authoritative state">
        <div><span>Status</span><strong>{session.status.replaceAll("_", " ")}</strong></div>
        <div><span>Revision</span><strong>{session.revision}</strong></div>
        <div><span>Mission budget</span><strong>${session.costCapUsd.toFixed(2)}</strong></div>
        <div><span>Paid model calls</span><strong>0</strong></div>
      </section>

      <section className="dashboard-grid">
        <article className="panel project-panel" aria-labelledby="project-title">
          <div className="panel-heading">
            <div><span className="panel-kicker">PROJECT</span><h2 id="project-title">{session.project.name}</h2></div>
            <span className="status status-warning">{relativeDeadline(session.project.deadline)}</span>
          </div>
          <p className="objective">{session.project.objective}</p>
          <h3>Constraints enforced</h3>
          <ul className="compact-list">
            {session.project.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
          </ul>
          <h3>Release readiness</h3>
          <div className="task-list">
            {session.project.tasks.map((task) => (
              <div className="task" key={task.id}>
                <span className={`task-mark ${task.status === "COMPLETED" ? "pass" : "blocked"}`} aria-hidden="true">
                  {task.status === "COMPLETED" ? "✓" : "!"}
                </span>
                <span>{task.title}</span>
                <span className={`status ${task.status === "COMPLETED" ? "status-pass" : "status-warning"}`}>{task.status}</span>
              </div>
            ))}
          </div>
          {session.plan ? (
            <div className="plan-card">
              <div className="panel-heading"><h3>Mission plan · v{session.plan.version}</h3><span className="status status-info">Drafted</span></div>
              {session.plan.phases.map((phase, index) => <p key={phase.name}><strong>{index + 1}. {phase.name}</strong> — {phase.tasks.join("; ")}</p>)}
              <p className="muted">Budget ${session.plan.budgetUsd.toFixed(3)} · {session.plan.requiredEvidence.length} required evidence checks</p>
            </div>
          ) : <div className="empty-state">The browser agent has not drafted a mission plan yet.</div>}
        </article>

        <article className="panel timeline-panel" aria-labelledby="timeline-title">
          <div className="panel-heading">
            <div><span className="panel-kicker">SHARED STATE</span><h2 id="timeline-title">Mission timeline</h2></div>
            {session.run ? <span className={`status ${session.run.state === "COMPLETED" ? "status-pass" : "status-live"}`}>{session.run.state}</span> : null}
          </div>
          {session.run ? (
            <div className="run-truth">
              <div><span>Current step</span><strong>{session.run.currentStep}</strong></div>
              <div><span>Cost truth</span><strong>${session.run.costUsd.toFixed(3)} · complete</strong></div>
            </div>
          ) : null}
          <ol className="timeline">
            {session.events.map((entry) => (
              <li key={entry.id}>
                <span className={`timeline-node actor-${entry.actor}`} aria-hidden="true" />
                <div>
                  <div className="event-meta"><strong>{entry.actor.replaceAll("_", " ")}</strong><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></div>
                  <p>{entry.summary}</p>
                  <code>{entry.kind}</code>
                </div>
              </li>
            ))}
          </ol>
          {session.events.length === 1 ? <div className="empty-state">Open this page in a WebMCP-compatible browser and send the judge prompt.</div> : null}
        </article>

        <article className="panel authority-panel" aria-labelledby="authority-title">
          <div className="panel-heading">
            <div><span className="panel-kicker">HUMAN AUTHORITY + PROOF</span><h2 id="authority-title">Decision and evidence</h2></div>
            <span className="status status-warning">Risk ceiling {session.policy.riskCeiling}</span>
          </div>
          <div className="boundary-card">
            <strong>Challenge policy active</strong>
            <p>The agent may inspect, plan, launch a bounded worker, observe, resume, and verify.</p>
            <p><strong>Denied:</strong> {session.policy.deniedCapabilities.join(", ")}.</p>
          </div>

          {pendingDecision && session.decisionRef ? (
            <section className="decision-card" aria-labelledby="decision-title">
              <span className="status status-warning">Human decision required</span>
              <h3 id="decision-title">{session.decision?.prompt}</h3>
              <p className="muted">The browser agent cannot call this decision control. One choice wins transactionally.</p>
              {session.decision?.choices.map((choice) => (
                <button
                  className={`choice ${choice.id === "staged_release" ? "choice-primary" : ""}`}
                  disabled={busy !== null}
                  key={choice.id}
                  onClick={() => void humanAction({ action: "choose_release", decisionRef: session.decisionRef, choice: choice.id }, choice.id)}
                  type="button"
                >
                  <strong>{choice.label}</strong><span>{choice.consequence}</span>
                </button>
              ))}
            </section>
          ) : session.decision ? (
            <div className={`decision-result ${session.decision.status === "APPROVED" ? "approved" : "denied"}`}>
              <strong>Human decision recorded</strong>
              <span>{session.decision.selectedChoice?.replaceAll("_", " ")}</span>
            </div>
          ) : <div className="empty-state">No human decision is pending.</div>}

          <section className="evidence-section" aria-labelledby="evidence-title">
            <div className="panel-heading"><h3 id="evidence-title">Evidence checklist</h3>{session.evidence ? <span className="status status-pass">Evaluated</span> : null}</div>
            {session.evidence ? (
              <>
                <ul className="evidence-list">
                  {session.evidence.checks.map((check) => <li key={check.id}><span aria-hidden="true">{check.status === "PASS" ? "✓" : "×"}</span><span>{check.label}</span><strong>{check.status}</strong></li>)}
                </ul>
                <div className="hash-row"><span>Evidence-pack hash</span><code title={session.evidence.packHash}>{shortHash(session.evidence.packHash)}</code></div>
                <div className="artifact-links">
                  {session.evidence.artifactRefs.map((id) => <a href={`/api/artifacts/${encodeURIComponent(id)}`} key={id} rel="noreferrer" target="_blank">{session.artifacts[id]?.name || id}</a>)}
                </div>
              </>
            ) : <div className="empty-state">A completed worker run is not verified until evidence is evaluated.</div>}
          </section>

          {session.delivery?.readyForAcceptance && !session.delivery.certificate && session.acceptanceToken && session.evidence ? (
            <button
              className="button button-primary button-full"
              disabled={busy !== null}
              onClick={() => void humanAction({ action: "accept_delivery", acceptanceToken: session.acceptanceToken, evidencePackHash: session.evidence?.packHash }, "accept")}
              type="button"
            >
              {busy === "accept" ? "Issuing certificate…" : "Accept this exact evidence pack"}
            </button>
          ) : null}

          <div className={`certificate-card ${accepted ? "certificate-valid" : ""}`}>
            <div className="panel-heading"><strong>Release certificate</strong><span className={`status ${accepted ? "status-pass" : "status-neutral"}`}>{accepted ? "VALID" : "NOT ISSUED"}</span></div>
            {session.delivery?.certificate ? <code title={session.delivery.certificate.certificateHash}>{shortHash(session.delivery.certificate.certificateHash)}</code> : <p>Issued only after all evidence passes and a human accepts the exact pack hash.</p>}
          </div>
        </article>
      </section>

      <footer>
        <span>All demo data is synthetic · no production access · no external actions</span>
        <span>Session expires {new Date(session.expiresAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
      </footer>
    </main>
  );
}
