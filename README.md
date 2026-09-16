# ArcadeOps Relay

**WebMCP mission control from browser intent to verified delivery.**

ArcadeOps Relay is an MIT-licensed reference implementation for governed agent execution. A browser agent can inspect a project, prepare a bounded mission, delegate a persisted worker run, bring a human into the moments that need judgment, resume without losing context, and verify an evidence-backed delivery.

![ArcadeOps Relay judge workspace](docs/assets/relay-dashboard.png)

## Why WebMCP is essential

WebMCP gives the browser agent structured, intent-level tools from the page the human is already viewing. The agent acts on the same scoped session and authoritative state as the UI without guessing the DOM or requiring a separately installed MCP server. Relay uses the imperative native API:

```ts
document.modelContext.registerTool({
  name: "inspect_project",
  description: "Inspect the bounded Project Aurora state.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  execute: inspectProject,
});
```

Registration is top-level, page-scoped, feature-detected, deduplicated across React rerenders, and aborted on navigation.

## Humans and agents together

The browser agent can inspect, plan, launch a bounded internal worker, observe, explain a block, resume after a separately recorded decision, and verify delivery. The human alone chooses the release strategy and accepts the exact evidence-pack hash. The worker cannot contact third parties, deploy, mutate production, or approve its own work.

## Architecture

```text
WebMCP browser agent ── seven intent tools ──► Next.js API
        ▲                                      │
        │                                      ▼
visible shared UI ◄── session view ── SQLite transactional state
        │                                      │
        └── human-only decisions ──────────────┘
                                               ▼
                                   evidence pack + Ed25519 certificate
```

Each session uses a signed, HTTP-only, SameSite cookie and a synthetic Project Aurora workspace. Mutations are same-origin, schema-validated, rate-limited, idempotent, transactionally isolated, and bound to signed versioned handles. See [the architecture](docs/architecture.md).

## Registered WebMCP tools

| Tool | Intent |
| --- | --- |
| `inspect_project` | Read the bounded project, constraints, policy, agents, and safe next actions. |
| `draft_mission_plan` | Draft, but do not launch, a budgeted mission and evidence plan. |
| `launch_mission` | Start one persisted bounded worker run using a signed plan handle. |
| `observe_run` | Read authoritative status, cost truth, events, decisions, artifacts, and evidence. |
| `explain_block` | Explain the policy gate and the split between agent and human authority. |
| `resume_after_human_decision` | Resume only after a matching, current human decision exists. |
| `verify_delivery` | Verify evidence, acceptance binding, certificate hash, and Ed25519 signature. |

## Project Aurora reference scenario

Project Aurora must be prepared for a safe staged release without production changes or external communication. One validation task is blocked. The agent creates a bounded plan and worker run; ArcadeOps pauses for a human choice between staged release with disclosed residual risk and postponement. After the human chooses, the agent resumes the exact run. Four evidence checks must pass before the human can accept the exact pack and a certificate can be issued.

The full reference scenario takes under five minutes. See [JUDGE_GUIDE.md](JUDGE_GUIDE.md) for the original WebMCP Challenge walkthrough.

## Quick start

Requirements: Node.js 24 and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. The human UI remains usable when WebMCP is unavailable; native tools require a compatible browser environment.

For the isolated container deployment:

```bash
docker compose -f compose.challenge.yml up --build
```

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `RELAY_SESSION_SECRET` | HMAC key for signed session and authority handles; required in production. | development-only fallback |
| `RELAY_DB_PATH` | SQLite persistence path. | `.data/arcadeops-relay.sqlite` |
| `RELAY_SESSION_TTL_MINUTES` | Session expiry. | `120` |
| `RELAY_MAX_MISSIONS_PER_SESSION` | Hard launch limit. | `2` |
| `RELAY_MAX_COST_USD` | Server-enforced mission cost ceiling. | `0.02` |
| `RELAY_COOKIE_SECURE` | Force Secure cookies (`1`) or local HTTP (`0`). | production-aware |

No API key is required for the current reference implementation. Its worker is deterministic, persisted, and performs real state transitions over synthetic inputs without paid provider calls.

## Testing

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run eval
npm run scan:secrets
npm run build
```

The browser suite covers light/dark desktop, narrow mobile, accessibility, session isolation, duplicate invocation, reset, tool lifecycle, and oversized input. Evaluation results are recorded in [docs/evals.md](docs/evals.md).

## Security model

- Server state, not model output, is authoritative.
- Every authority reference is HMAC-signed, session-scoped, versioned, target-bound, and expiring.
- The WebMCP surface has no approve or accept tool.
- Human decisions are recorded through a separate visible UI route.
- One transactional decision wins; replays and stale handles fail closed.
- Evidence must be fully evaluated before acceptance.
- Acceptance is bound to the exact evidence-pack SHA-256 hash.
- Certificates use a persisted Ed25519 key pair and are independently signature-verifiable.
- Production data and external capabilities do not exist in reference mode.

See [SECURITY.md](SECURITY.md) for reporting and deployment assumptions.

## Evidence and certificate model

The worker produces immutable synthetic artifacts with SHA-256 hashes. ArcadeOps creates a canonical evidence pack containing four required checks and artifact references. Human acceptance records that exact pack hash. The certificate payload binds the project, plan version, run, decision, evidence hash, artifact hashes, and acceptance timestamp; its signature and certificate hash are verified by `verify_delivery`.

## Open-source roadmap

ArcadeOps Relay started as a self-contained vertical slice for the OpenAI WebMCP Challenge and is now maintained as a reusable reference for governed agent workflows. Near-term work focuses on turning the deterministic reference worker into an optional real-agent execution path without weakening its authority and evidence boundaries.

Planned work includes:

- optional OpenAI/Codex-backed coding-agent runs behind the existing mission and policy gates;
- evidence-backed repository maintenance workflows such as issue triage, test generation, change review, and release preparation;
- provider-neutral worker adapters so the governance layer remains independently testable;
- richer evaluations for tool authorization, stale/replayed actions, human approval boundaries, and delivery verification;
- reusable examples and documentation for maintainers integrating governed agents into open-source projects.

The intended Codex integration keeps the same core rule as the reference implementation: model output proposes or performs bounded work, while authoritative state, permissions, approvals, and evidence verification remain outside the model.

## Project history

This repository was originally created as a public vertical slice for the OpenAI WebMCP Challenge after August 25, 2026: the WebMCP adapter, seven tools, UI, Project Aurora session, deterministic worker, policy/authority gates, evidence/certificate pipeline, evaluations, deployment package, and public documentation.

ArcadeOps previously contained private mission, approval, evidence, and certificate concepts plus three global read-only documentation-discovery WebMCP tools. This public repository does not contain the private repository history or unrelated proprietary modules. [HACKATHON.md](HACKATHON.md) records the exact baseline and before/after boundary.

## Limitations

- The current reference worker is intentionally deterministic and uses synthetic data; the planned Codex-backed worker is not represented as implemented yet.
- SQLite and the rate limiter target one isolated application instance, not a horizontally scaled fleet.
- A valid signature proves certificate integrity under the included public key; issuer trust still depends on obtaining the deployment key fingerprint from a trusted channel.
- WebMCP availability depends on a compatible browser environment.

## Live demo

Live: <https://arcadeops-relay.51-210-5-255.sslip.io>. Deployment evidence is recorded in [HACKATHON.md](HACKATHON.md).

Devpost: <https://devpost.com/software/arcadeops-relay>.

## Video

Watch the 1:12 public demonstration: <https://youtu.be/ZLokWHrxxjI>.

## Contributing

Issues and pull requests are welcome, particularly around governed coding-agent workflows, evaluations, security boundaries, and reusable WebMCP patterns.

## License

[MIT](LICENSE) © 2026 ArcadeOps contributors.
