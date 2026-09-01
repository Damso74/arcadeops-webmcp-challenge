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

The public repository starts from a new root commit so private history cannot be exposed. Its exact final commit is recorded here after publication.

## Deployment and publication

No deployment, repository, video, or submission URL is claimed until it is publicly verified.

## Known limitations

See the README limitations section. Native ChatGPT browser verification, public deployment, video publication, and Devpost status are tracked as separate release gates and never inferred from local tests.
