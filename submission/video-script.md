# Video script — final 2:39

Narration: 318 words. English, clear international delivery, approximately 118 words per minute with the marked pauses.

## 0:00–0:13 — Hook

AI agents can perform work, but teams still need to know who authorized an action, whether the result is real, and what evidence supports it. [pause]

## 0:13–0:28 — Product

ArcadeOps Relay lets a browser agent delegate work to AI workers through native WebMCP, while a human retains authority. Both see the same live, authoritative project state.

## 0:28–0:49 — Discovery

This is Project Aurora: a staged release due tomorrow, one blocked validation task, and strict rules forbidding production changes or external contact. The page registers seven intent-level tools. The browser agent calls inspect project—not the DOM—and receives the objective, constraints, permissions, risk ceiling, and safe next actions.

## 0:49–1:08 — Planning

It drafts a bounded mission plan. The phases, cost cap, acceptance criteria, required evidence, and likely human decisions appear immediately in ArcadeOps. Drafting does not silently launch work.

## 1:08–1:29 — Delegation

Now the browser agent launches one persisted worker mission with a signed plan handle. The server enforces the tool allowlist, budget, session boundary, and idempotency. The worker creates a real pre-decision analysis, then the mission pauses.

## 1:29–1:50 — Human decision

The Decisions Inbox explains why the release strategy requires a human, what the agent may do, and the consequences of staging or postponing. There is no approval tool in WebMCP. I choose a staged release with documented residual risk.

## 1:50–2:12 — Continuation

The browser agent observes that separate decision and resumes the exact persisted run. Stale, replayed, cross-session, or duplicated calls fail closed or return the existing result. The worker produces the release-readiness summary and rollback plan—without contacting anyone or changing production.

## 2:12–2:35 — Proof

Completion alone is not verification. ArcadeOps evaluates four required checks. All pass, creating a canonical evidence-pack hash. I accept that exact version. Relay issues an Ed25519 release certificate binding the run, decision, artifacts, and acceptance. The browser agent verifies both its hash and signature: certificate valid.

## 2:35–2:48 — Closing

ArcadeOps Relay turns browser agents into accountable managers of AI work: humans set authority, agents execute, and evidence proves the result.

## Pronunciation notes

- ArcadeOps: “arcade ops”
- WebMCP: “web M-C-P”
- Project Aurora: standard English pronunciation
- Ed25519: “Ed twenty-five five nineteen”
