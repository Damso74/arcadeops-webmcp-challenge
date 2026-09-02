# ArcadeOps Relay

**WebMCP mission control from browser intent to verified delivery.**

## Inspiration

Browser agents can understand the page in front of a person, while worker agents can execute substantial tasks. What was missing was the operational layer between them: a shared place to turn intent into a mission, keep work moving, bring in human judgment at the right moment, and carry trustworthy context through to delivery. We built ArcadeOps Relay as that mission control layer.

## What it does

Relay gives a browser agent seven intent-level WebMCP tools on a live Project Aurora workspace. The agent inspects the objective and constraints, drafts a bounded mission, delegates a persisted internal worker, and follows authoritative progress. ArcadeOps coordinates the handoffs and surfaces one strategic release choice when human judgment adds value. The person sees the consequences and evidence in the same workspace, chooses whether to stage or postpone, and the exact run resumes with its context intact. The worker produces the release-readiness artifacts, ArcadeOps evaluates four required evidence checks, and a hash-bound Ed25519 certificate proves the accepted delivery.

## Why WebMCP

WebMCP lets the browser agent use the current page, scoped judge session, project, and human-visible state without DOM guessing or a separately installed MCP connector. Relay registers tools through `document.modelContext.registerTool(...)`. Tools appear only on the challenge page, use strict schemas, avoid duplicate registration, and disappear on navigation.

## Human-agent collaboration

The human, browser agent, and worker share one authoritative workspace. The browser agent turns visible project context into a mission; the worker executes; ArcadeOps preserves progress, cost, decisions, and evidence; and the human guides the strategic moments. Together they can delegate real bounded work, resume safely after a decision, and prove delivery without losing context or letting an agent approve itself.

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
