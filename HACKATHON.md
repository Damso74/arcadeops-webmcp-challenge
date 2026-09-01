# Hackathon provenance

## Baseline

- Challenge start: `2026-09-01T10:15:45.7447457+02:00`
- Private ArcadeOps integration baseline: `210b2aaa515f6f921a0b801797cc02301f979258`
- Challenge branch: `hackathon/webmcp-challenge-20260901`
- Public export strategy: new history containing only this MIT-licensed vertical slice.

The existing `Damso74/ArcadeOps` repository is private and remains private. This export does not contain its Git history, customer data, credentials, production configuration, or unrelated proprietary modules.

## Before and after

| Area | Pre-existing ArcadeOps | Added after August 25, 2026 for this challenge |
| --- | --- | --- |
| WebMCP | Three read-only public documentation discovery tools | Page-scoped adapter and seven intent-level mission tools |
| Browser collaboration | OAuth MCP/server primitives | Shared browser-agent, worker, human, and evidence loop |
| Demo state | Product organizations and projects | Per-session synthetic Project Aurora workspace |
| Worker | General product runtime | Deterministic bounded release-readiness worker |
| Authority | Product approval concepts | Signed session-scoped decision and acceptance handles |
| Proof | Product evidence/certificate concepts | Self-contained canonical evidence pack and Ed25519 certificate |
| Policy | Product policies | Challenge policy denying all external and production actions |
| Quality | Existing repository suites | Dedicated unit, integration, browser, security, and WebMCP eval suites |
| Publication | Private proprietary source | Self-contained MIT public challenge repository |

## Challenge capabilities and files

- `components/WebMcpRelay.tsx`: native imperative WebMCP lifecycle.
- `app/api/*`: bounded session, tool, human-action, artifact, and health contracts.
- `lib/engine.ts`: persisted mission, pause, resume, evidence, acceptance, and certificate state machine.
- `lib/security.ts`: signed expiring authority handles.
- `lib/store.ts`: transactional SQLite isolation and rate limiting.
- `tests/`: tool lifecycle, full mission flow, adversarial controls, browser E2E, and evals.
- `docs/` and `submission/`: public architecture, evidence, judge, media, and submission materials.

## Verification evidence

Current local results are maintained in `docs/implementation-report.md` and `docs/evals.md`. Published URL checks are added only after independent public verification.

## Challenge commits

The parent ArcadeOps challenge branch begins with:

- `4d5f5ec8ba1c1058dfc40b2f821a68acd6ec25f1` — challenge start ledger.
- `c4cfe1f4` — complete Relay vertical slice, hardening, tests, documentation, and deployment package.
- `5f5472c6` — first operations-workspace visual pass.
- `877ab514` — authoritative reset synchronization.
- `8b683727` — flat Project Aurora operations layout and eight reusable UI primitives.
- `8d75bfe1` — deployment archive exclusion.
- `21c1999b` — Catalyst-inspired operations refinement: grouped navigation, discreet WebMCP command, actionable review controls, and deterministic test isolation.

The public repository starts from a new root commit so private history cannot be exposed: <https://github.com/Damso74/arcadeops-webmcp-challenge>. Anonymous README and MIT license reads returned HTTP 200 after publication. The verified public runtime/UI head before final media packaging is `955f91793173a7026b15df14cfc0b2261468b81e`.

## Deployment and publication

- Public source: <https://github.com/Damso74/arcadeops-webmcp-challenge> — VERIFIED PUBLIC.
- Live deployment: <https://arcadeops-relay.51-210-5-255.sslip.io> — HTTPS 200 and 15/15 deployed E2E tests passed after the flat operations redesign. A native ChatGPT in-app browser flow reached a valid certificate at `2026-09-01T09:41:16Z`; the later redesign did not alter its WebMCP adapter or server contracts.
- Media: final deployed-app capture rendered at 1920×1080, 1:48.00, H.264/AAC, with English narration, six paced product sequences, functional punch-ins, and burned captions; video SHA-256 `15f9baf4efd7b1b1690a68987f3794e4f2d772489f8c4380df8ce24db184ec87`; thumbnail SHA-256 `544040f876a8dee30b2f6888a63846228a7dc324deb1973c6cf94d63158c6eb5`.
- YouTube and Devpost: not yet claimed.

## Known limitations

See the README limitations section. Native ChatGPT browser verification and the public deployment are verified. YouTube publication and Devpost status remain separate release gates and are never inferred from prepared local artifacts.
