# Implementation report

## Delivered vertical slice

ArcadeOps Relay is a self-contained challenge application implementing a real, persisted Project Aurora state machine. The native WebMCP adapter exposes seven intent-level tools. It does not automate the DOM or alias a custom protocol as WebMCP.

The bounded worker is deterministic by design: it creates actual versioned application state and hashed artifacts over synthetic inputs, while using no paid model or external capability. The human decision and delivery acceptance are separate visible UI actions and cannot be invoked through the registered tool surface.

## Local release evidence — 2026-09-01

| Check | Result | Scope |
| --- | --- | --- |
| ESLint | PASSED | zero warnings |
| TypeScript | PASSED | `tsc --noEmit` |
| Unit/integration/eval tests | PASSED | 14 tests |
| Browser E2E | PASSED | 15 tests, desktop light/dark and mobile |
| Accessibility | PASSED | Axe checks in browser suite |
| Production build | PASSED | Next.js 16.3.4 standalone |
| Dependency audit | PASSED | 0 known npm vulnerabilities |
| Repository secret scan | PASSED | 74 challenge-worktree files; 65 files in the final clean public clone |
| Prompt-only security scan | PASSED | complete executable runtime scope, 0 reportable findings; sealed contract `scan_arcadeops_relay_20260901` |
| Native ChatGPT browser | PASSED | deployed in-app browser discovered seven tools and completed a valid certificate flow at `2026-09-01T09:41:16Z`; the subsequent UI-only refactor left the adapter and contracts unchanged |
| Clean clone | PASSED | fresh local clone, `npm ci`, secret scan, lint, typecheck, 14 tests, complete build with artifact route |
| Deployed smoke and E2E | PASSED | HTTPS health/page 200; 15/15 remote browser tests on Codex workbench UI commit `79ee6bef`; native flow previously passed |

The development browser console reports React's expected CSP warning because development debugging attempts `eval`; production does not use it. The production CSP intentionally omits `unsafe-eval`.

## Security review disposition

Source review identified and fixed two release-blocking control gaps before publication:

1. body size is now enforced on the actual UTF-8 request body, including requests without a trustworthy `Content-Length`;
2. optional run handles supplied to observe, explain, and verify are validated for session, target, version, signature, and expiry.

No validated critical, high, medium, or low application vulnerability remains in the reviewed current source. The prompt-only scan contract was sealed at `2026-09-01T09:12:04Z`; its snapshot digest is `c294a71c8a72aefeec13d7c3fe687c801cd766b6b6af6545730fd7561355641b`. An independent baseline subagent was unavailable under this thread's execution policy, which is recorded as a scan limitation. Deployment assumptions and residual limitations are explicit in `SECURITY.md`.

## Pending publication gates

The public source is verified at <https://github.com/Damso74/arcadeops-webmcp-challenge> and the live deployment at <https://arcadeops-relay.51-210-5-255.sslip.io>. The non-root, read-only-rootfs container is capped at one CPU and 512 MiB and runs on an isolated Docker network alias behind the existing TLS proxy. ArcadeOps production health remained HTTP 200 after the hot proxy load.

The final video uses actual footage captured from deployed workbench UI commit `79ee6bef` while invoking the same native-compatible seven-tool surface. It is 1920×1080 H.264/AAC, 1:16.00, with burned English captions. The narration was generated in ElevenLabs with `Liam - Energetic, Social Media Creator` on Eleven Multilingual v2 at generated speed 1.20, stability 0.42, similarity 0.75, and style 0.15; post-production applies no tempo or pitch stretching. The edit uses six numbered product sequences, direct cuts, and functional punch-ins on planning, human decision, continuation, and evidence. Loudness measured -16.6 LUFS integrated with a -1.5 dBTP true peak. The title card, actual two-choice decision pause, six sequence states, final certificate frame, silence detection, codec metadata, nine representative frames, and the 1280×720 thumbnail were inspected. The 2.93-second closing hold is intentionally silent and no unintended black segment was detected. Video SHA-256: `2157f6d2e480df5b098c4a52a92ef047dfd71672a540111429ee6f7fd1464464`. Thumbnail SHA-256: `aae07ccaeac3148dc64b202fabe8f407302b8f1e1c52bf5eba4cca49e5df43b3`. YouTube publication and Devpost submission remain separate external gates.
