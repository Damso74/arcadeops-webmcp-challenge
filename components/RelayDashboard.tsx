"use client";

import {
  Activity,
  Check,
  ChevronRight,
  Command,
  Copy,
  FileCheck2,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  Play,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

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
  plan: null | { version: number; phases: Array<{ name: string; tasks: string[] }>; budgetUsd: number; requiredEvidence: string[] };
  run: null | { id: string; state: string; currentStep: string; costUsd: number; costTruth: string; artifactRefs: string[] };
  decision: null | {
    id: string;
    status: "PENDING" | "APPROVED" | "DENIED";
    prompt: string;
    selectedChoice: "staged_release" | "postpone" | null;
    choices: Array<{ id: "staged_release" | "postpone"; label: string; consequence: string }>;
  };
  evidence: null | { packHash: string; checks: Array<{ id: string; label: string; status: "PASS" | "FAIL" }>; artifactRefs: string[] };
  delivery: null | { readyForAcceptance: boolean; acceptedEvidenceHash: string | null; certificate: null | { certificateHash: string } };
  artifacts: Record<string, { name: string; mediaType: string; sha256: string }>;
  events: Array<{ id: string; at: string; actor: string; kind: string; summary: string }>;
  planHandle: string | null;
  runHandle: string | null;
  decisionRef: string | null;
  acceptanceToken: string | null;
};

type SessionResponse = { ok: boolean; session?: SessionView; errorCode?: string };
type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const judgePrompt =
  "Inspect Project Aurora, prepare a safe release mission, delegate the work, stop for any required human decision, and verify the final delivery. Do not bypass approvals or modify production.";

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard, active: false },
  { label: "Projects", href: "#project", icon: FolderKanban, active: true },
  { label: "Missions", href: "#mission", icon: Target, active: false },
  { label: "Tasks", href: "#readiness", icon: ListChecks, active: false },
  { label: "Decisions", href: "#review", icon: Inbox, active: false },
  { label: "Approvals", href: "#review", icon: ShieldCheck, active: false },
  { label: "Runs", href: "#activity", icon: Activity, active: false },
  { label: "Team", href: "#policy", icon: Users, active: false },
  { label: "History", href: "#activity", icon: History, active: false },
] as const;

function shortHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function actorLabel(actor: string): string {
  return ({ arcadeops: "ArcadeOps", browser_agent: "Browser operator", worker: "Release worker", human: "Human reviewer" }[actor] || actor.replaceAll("_", " "));
}

function stateTone(state: string): Tone {
  if (["ACCEPTED", "COMPLETED", "PASS", "APPROVED"].includes(state)) return "success";
  if (["AWAITING_HUMAN_DECISION", "BLOCKED", "PENDING"].includes(state)) return "warning";
  if (["DENIED", "FAIL"].includes(state)) return "danger";
  if (["RUNNING", "PLAN_DRAFTED", "READY_FOR_ACCEPTANCE"].includes(state)) return "info";
  return "neutral";
}

function StatusDot({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`status-dot status-${tone}`}><i aria-hidden="true" />{label}</span>;
}

function MetadataList({ items }: { items: Array<ReactNode> }) {
  return <div className="metadata-list">{items.map((item, index) => <span key={index}>{item}</span>)}</div>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

function PageHeader({ session, webMcp, busy, onRun }: { session: SessionView; webMcp: { connected: boolean; count: number }; busy: string | null; onRun: () => void }) {
  const completed = session.project.tasks.filter((task) => task.status === "COMPLETED").length;
  return (
    <header className="page-header" id="project">
      <div className="page-header-main">
        <h1>{session.project.name}</h1>
        <MetadataList items={[<StatusDot key="review" label="Release review" tone="info" />, "Due tomorrow", `${completed}/${session.project.tasks.length} checks complete`, `Revision ${session.revision}`]} />
        <p>{session.project.objective}</p>
      </div>
      <div className="page-actions">
        <StatusDot label={webMcp.connected ? `WebMCP connected · ${webMcp.count} tools` : "WebMCP unavailable"} tone={webMcp.connected ? "success" : "warning"} />
        <button className="button button-primary" disabled={busy !== null} onClick={onRun} type="button"><Play aria-hidden="true" size={14} />{busy === "reset" ? "Preparing…" : "Run review"}</button>
        <button aria-label="More actions" className="icon-button" title="More actions" type="button"><MoreHorizontal aria-hidden="true" size={18} /></button>
      </div>
    </header>
  );
}

function CommandBar({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <section className="command-bar" aria-label="Browser instruction">
      <Command aria-hidden="true" size={16} />
      <p><strong>Browser instruction</strong><span>{judgePrompt}</span></p>
      <button className="command-copy" onClick={onCopy} type="button">{copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}{copied ? "Copied" : "Copy"}</button>
    </section>
  );
}

function DataTable({ tasks }: { tasks: SessionView["project"]["tasks"] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Check</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>{tasks.map((task) => <tr key={task.id}><td>{task.title}</td><td>Release worker</td><td><StatusDot label={task.status === "COMPLETED" ? "Complete" : "Blocked"} tone={stateTone(task.status)} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ActivityFeed({ events }: { events: SessionView["events"] }) {
  return (
    <ol className="activity-feed">
      {events.map((entry) => (
        <li key={entry.id}>
          <span className={`feed-node actor-${entry.actor}`} aria-hidden="true" />
          <div className="feed-content">
            <div><strong>{actorLabel(entry.actor)}</strong><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></div>
            <p>{entry.summary}</p><code>{entry.kind === "HUMAN_DECISION_REQUIRED" ? "authority_gate_opened" : entry.kind.toLowerCase()}</code>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReviewPanel({ session, busy, onHumanAction }: { session: SessionView; busy: string | null; onHumanAction: (body: Record<string, unknown>, label: string) => void }) {
  const pending = session.decision?.status === "PENDING";
  const accepted = session.status === "ACCEPTED";
  return (
    <aside className="review-panel" id="review" aria-labelledby="review-title">
      <div className="review-heading"><h2 id="review-title">Review &amp; controls</h2><StatusDot label={pending ? "1 review open" : "No reviews pending"} tone={pending ? "warning" : "success"} /></div>
      <section className="review-section">
        <h3>Release decision</h3>
        {pending && session.decisionRef ? (
          <div className="decision-block">
            <StatusDot label="Human decision required" tone="warning" />
            <p className="decision-question">{session.decision?.prompt}</p>
            <p>The run is paused. Only the visible human control can record this decision.</p>
            <div className="decision-actions">{session.decision?.choices.map((choice) => <button disabled={busy !== null} key={choice.id} onClick={() => onHumanAction({ action: "choose_release", decisionRef: session.decisionRef, choice: choice.id }, choice.id)} type="button"><strong>{choice.label}</strong><span>{choice.consequence}</span></button>)}</div>
          </div>
        ) : session.decision ? (
          <div className={`decision-result ${session.decision.status === "APPROVED" ? "approved" : "denied"}`}><StatusDot label="Human decision recorded" tone={session.decision.status === "APPROVED" ? "success" : "danger"} /><span>{session.decision.selectedChoice?.replaceAll("_", " ")}</span></div>
        ) : <EmptyState>No reviews pending.</EmptyState>}
      </section>
      <section className="review-section" id="evidence">
        <h3>Evidence</h3>
        {session.evidence ? (
          <>
            <ul className="evidence-list">{session.evidence.checks.map((check) => <li key={check.id}><StatusDot label={check.label} tone={stateTone(check.status)} /><strong>{check.status}</strong></li>)}</ul>
            <div className="hash-row"><span>Evidence pack</span><code title={session.evidence.packHash}>{shortHash(session.evidence.packHash)}</code></div>
            <div className="artifact-links">{session.evidence.artifactRefs.map((id) => <a href={`/api/artifacts/${encodeURIComponent(id)}`} key={id} rel="noreferrer" target="_blank"><FileCheck2 aria-hidden="true" size={13} />{session.artifacts[id]?.name || id}</a>)}</div>
          </>
        ) : <EmptyState>Evidence will appear after the run finishes.</EmptyState>}
        {session.delivery?.readyForAcceptance && !session.delivery.certificate && session.acceptanceToken && session.evidence ? <button className="button button-primary button-full" disabled={busy !== null} onClick={() => onHumanAction({ action: "accept_delivery", acceptanceToken: session.acceptanceToken, evidencePackHash: session.evidence?.packHash }, "accept")} type="button">Accept this exact evidence pack</button> : null}
        <div className="certificate-row"><StatusDot label="Release certificate" tone={accepted ? "success" : "neutral"} /><strong>{accepted ? "VALID" : "Not issued"}</strong>{session.delivery?.certificate ? <code title={session.delivery.certificate.certificateHash}>{shortHash(session.delivery.certificate.certificateHash)}</code> : null}</div>
      </section>
      <section className="review-section" id="policy">
        <h3>Operating boundary</h3>
        <MetadataList items={[`Policy ${session.policy.riskCeiling}`, `$${session.costCapUsd.toFixed(2)} cost cap`, `${session.launchCount}/${session.maxLaunches} runs used`]} />
        <p className="policy-copy"><strong>Unavailable:</strong> {session.policy.deniedCapabilities.join(", ")}.</p>
      </section>
    </aside>
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
      setSession(data.session); setError(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "SESSION_UNAVAILABLE"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const status = (event: Event) => setWebMcp((event as CustomEvent<{ connected: boolean; count: number }>).detail);
    const changed = () => void load();
    window.addEventListener("relay:webmcp-status", status); window.addEventListener("relay:state-changed", changed);
    if (document.modelContext) setWebMcp({ connected: true, count: 7 });
    return () => { window.removeEventListener("relay:webmcp-status", status); window.removeEventListener("relay:state-changed", changed); };
  }, [load]);

  async function resetDemo() {
    setBusy("reset"); setError(null);
    try {
      const response = await fetch("/api/session", { method: "POST" }); const data = (await response.json()) as SessionResponse;
      if (!data.ok || !data.session) throw new Error(data.errorCode || "RESET_REFUSED"); setSession(data.session);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "RESET_REFUSED"); }
    finally { setBusy(null); }
  }

  async function humanAction(body: Record<string, unknown>, label: string) {
    setBusy(label); setError(null);
    try {
      const response = await fetch("/api/human", { method: "POST", headers: { "content-type": "application/json", "x-relay-human-action": "visible-ui" }, body: JSON.stringify(body) });
      const data = (await response.json()) as SessionResponse;
      if (!data.ok || !data.session) throw new Error(data.errorCode || "HUMAN_ACTION_REFUSED"); setSession(data.session);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "HUMAN_ACTION_REFUSED"); }
    finally { setBusy(null); }
  }

  async function copyPrompt() { await navigator.clipboard.writeText(judgePrompt); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }

  if (loading) return <main className="loading-shell" aria-busy="true"><div className="loading-rail" /><div className="loading-workspace"><div className="loading-block" /><div className="loading-lines" /></div><span className="sr-only">Creating an isolated Project Aurora workspace</span></main>;
  if (!session) return <main className="error-page"><h1>Workspace unavailable</h1><p>{error || "The isolated session could not be created."}</p><button className="button button-primary" onClick={() => void load()} type="button">Retry</button></main>;

  const completedTasks = session.project.tasks.filter((task) => task.status === "COMPLETED").length;
  return (
    <main className="operations-shell" id="overview">
      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="brand-block"><span className="brand-mark" aria-hidden="true">AO</span><div><strong>ArcadeOps</strong><span>Operations</span></div></div>
        <nav className="business-nav" aria-label="Main navigation">{navigation.map(({ label, href, icon: Icon, active }) => <a className={active ? "active" : ""} href={href} key={label}><Icon aria-hidden="true" size={16} strokeWidth={1.8} /><span>{label}</span>{label === "Decisions" && session.decision?.status === "PENDING" ? <i className="nav-attention" aria-label="1 pending decision" /> : null}</a>)}</nav>
        <div className="sidebar-note"><ShieldCheck aria-hidden="true" size={15} /><div><strong>Isolated workspace</strong><span>Synthetic data · no external actions</span></div></div>
      </aside>
      <div className="workspace-shell">
        <div className="topbar"><div className="breadcrumbs"><span>Projects</span><ChevronRight aria-hidden="true" size={13} /><strong>{session.project.name}</strong></div></div>
        <div className="workspace-content">
          <PageHeader session={session} webMcp={webMcp} busy={busy} onRun={() => void resetDemo()} />
          <nav className="project-tabs" aria-label="Project sections"><a className="active" href="#overview">Overview</a><a href="#readiness">Readiness</a><a href="#activity">Activity</a><a href="#evidence">Deliverables</a></nav>
          {error ? <div className="error-banner" role="alert">Request refused: {error}. Refresh before retrying.</div> : null}
          <CommandBar copied={copied} onCopy={() => void copyPrompt()} />
          <div className="project-layout">
            <div className="project-main">
              <section className="content-section" id="readiness" aria-labelledby="readiness-title">
                <div className="section-heading"><div><h2 id="readiness-title">Release readiness</h2><p>{completedTasks} checks complete, one validation remains blocked.</p></div><StatusDot label={session.run?.state || "Not started"} tone={stateTone(session.run?.state || "")} /></div>
                <div className="constraints-block"><h3>Operating constraints</h3><ul>{session.project.constraints.map((constraint) => <li key={constraint}><Check aria-hidden="true" size={13} />{constraint}</li>)}</ul></div>
                <DataTable tasks={session.project.tasks} />
              </section>
              <section className="content-section" id="mission" aria-labelledby="plan-title">
                <div className="section-heading"><div><h2 id="plan-title">{session.plan ? `Mission plan · v${session.plan.version}` : "Mission plan"}</h2><p>{session.plan ? `Budget $${session.plan.budgetUsd.toFixed(3)} · ${session.plan.requiredEvidence.length} required evidence checks` : "No release plan has been created."}</p></div>{session.plan ? <StatusDot label="Prepared" tone="info" /> : null}</div>
                {session.plan ? <ol className="phase-list">{session.plan.phases.map((phase, index) => <li key={phase.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{phase.name}</strong><p>{phase.tasks.join(" · ")}</p></li>)}</ol> : <EmptyState>Create a release plan from the browser instruction above.</EmptyState>}
              </section>
              <section className="content-section" id="activity" aria-labelledby="activity-title">
                <div className="section-heading"><div><h2 id="activity-title">Execution</h2><p>{session.run ? session.run.currentStep : "No run in progress."}</p></div><MetadataList items={[`$${session.run?.costUsd.toFixed(3) || "0.000"} cost`, session.run?.costTruth || "No usage"]} /></div>
                <ActivityFeed events={session.events} />
              </section>
            </div>
            <ReviewPanel session={session} busy={busy} onHumanAction={(body, label) => void humanAction(body, label)} />
          </div>
          <footer><span>All data is synthetic · no production access · no external actions</span><span>Session expires {new Date(session.expiresAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span></footer>
        </div>
      </div>
    </main>
  );
}
