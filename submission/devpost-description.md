# ArcadeOps Relay

**Browser agents delegate real work to AI workers. Humans decide. Evidence proves.**

## Inspiration

Browser agents can navigate and call tools, while worker agents can execute substantial tasks. The accountability gap appears between them: who authorized the delegated action, whether a retry duplicated work, whether “done” reflects authoritative state, and what evidence supports the result. We built ArcadeOps Relay to make that delegation legible and governed.

## What it does

Relay gives a browser agent seven intent-level WebMCP tools on a live Project Aurora workspace. The agent inspects the objective and constraints, drafts a bounded mission, launches a persisted internal worker, and observes progress. ArcadeOps pauses at a strategic release decision. The human sees the reason, consequences, and evidence in the same page and chooses whether to stage the release or postpone. The agent can then resume the exact run—but cannot create the decision. The worker produces release-readiness artifacts, ArcadeOps evaluates four required evidence checks, and the human accepts the exact evidence-pack hash. Only then is an Ed25519 release certificate issued and independently verified.

## Why WebMCP

WebMCP lets the browser agent use the current page, scoped judge session, project, and human-visible state without DOM guessing or a separately installed MCP connector. Relay registers tools through `document.modelContext.registerTool(...)`. Tools appear only on the challenge page, use strict schemas, avoid duplicate registration, and disappear on navigation.

## Human-agent collaboration

The human and agents share one authoritative workspace. The browser agent delegates rather than impersonating a worker. The worker executes rather than claiming authority. The human decides at the strategic gate and accepts a specific evidence version. Together they can delegate real bounded work, pause for authority, resume idempotently, and prove delivery—without allowing an agent to approve itself.

## How it was built

Next.js 16, React 19, TypeScript, Zod, native imperative WebMCP, server-side SQLite transactions, signed HMAC authority handles, canonical SHA-256 evidence packs, and Ed25519 certificates. Playwright covers desktop, dark theme, mobile, accessibility, isolation, tool lifecycle, and the complete visible workflow. Vitest covers state transitions and adversarial security cases. The app runs as a non-root Docker container behind TLS.

The judge worker is intentionally deterministic. It performs real persisted state transitions and creates real hashed artifacts over synthetic Project Aurora data, but has no network, provider, production, email, calendar, financial, deployment, or destructive capability.

## Challenges

- Making WebMCP registration survive React Strict Mode without duplicate tools.
- Keeping server authorization authoritative while exposing useful browser intent.
- Binding decisions, resumes, and acceptance to exact signed targets and versions.
- Making retries safe under duplicate and concurrent calls.
- Distinguishing worker completion from evaluated evidence and accepted delivery.
- Providing a credential-free public demo without exposing production data or private source.

## Accomplishments

- Seven native, page-scoped intent tools.
- One genuine browser-agent → persisted worker → human decision → evidence → certificate loop.
- Zero approval bypasses and zero duplicate mutations in the reproducible five-run evaluation set.
- Signed, expiring, session-scoped handles and exact evidence-hash acceptance.
- A public, synthetic, resettable judge experience with no paid model calls.
- Automated unit, integration, browser, accessibility, evaluation, build, dependency, and secret checks.

## What was new for the challenge

ArcadeOps existed before August 25, 2026 as a private agent operations platform with mission, approval, evidence, and certificate concepts. The challenge work is the self-contained WebMCP adapter; seven mission tools; Project Aurora judge workspace; live browser-agent/worker collaboration; deterministic challenge runtime; challenge policy; session isolation; authority and evidence binding; WebMCP evaluations; public deployment package; documentation; video; and submission materials. The private ArcadeOps repository and unrelated proprietary components are not published.

## What we learned

The best browser tools describe product intent, not page mechanics. Shared state matters more than another chat transcript. A model response is not delivery truth. Human authority becomes usable when the page explains both the blocked action and the consequences, while signed handles let the agent safely continue afterward.

## What's next

The same pattern can govern broader agent-native operations: richer workers, organization policies, external evidence attestations, and portable certificates—while preserving scoped authority, explicit human decisions, and honest cost and completion truth.

## Judge data

All demo data is synthetic. No credentials are required.
