# Final release and submission checklist

Status values: `PASSED`, `FAILED`, or `NOT RUN` only.

## Product

- [x] Live challenge page works from a fresh session — PASSED
- [x] Native WebMCP detected — PASSED in ChatGPT in-app browser
- [x] Seven tools invoked in a compatible browser agent — PASSED natively
- [x] Full fresh Project Aurora scenario — PASSED locally, deployed E2E, and native browser
- [x] Reset and cross-session isolation — PASSED locally and deployed E2E
- [x] Persisted worker terminal state — PASSED locally, deployed E2E, and native browser
- [x] Four required evidence checks pass — PASSED locally, deployed E2E, and native browser
- [x] Acceptance binds exact evidence hash — PASSED locally, deployed E2E, and native browser
- [x] Certificate issues and verifies — PASSED locally, deployed E2E, and native browser
- [x] No external action or production data — PASSED by code, tests, deployed state, and policy inspection

## Engineering gate

- [x] Lint — PASSED
- [x] Type check — PASSED
- [x] Unit/integration/evaluation tests — PASSED (14)
- [x] Browser E2E — PASSED (15)
- [x] Accessibility and responsive coverage — PASSED
- [x] Production build — PASSED
- [x] npm audit — PASSED (0 known vulnerabilities)
- [x] Source secret scan — PASSED
- [x] Prompt-only security scan contract finalized — PASSED (complete executable scope, 0 findings)
- [x] Clean public clone install/test/build — PASSED, including artifact route manifest
- [x] Deployed smoke and full scenario — PASSED: 15/15 remote E2E after the UI redesign; native ChatGPT flow previously passed with the unchanged adapter/contracts

## Public source

- [x] Separate repository public — PASSED: https://github.com/Damso74/arcadeops-webmcp-challenge
- [x] MIT license visible — PASSED locally
- [x] English README and judge guide — PASSED locally
- [x] Pre-existing versus challenge work documented — PASSED locally
- [x] Public history secret scan — PASSED with single-purpose new history and local equivalent scanner; gitleaks unavailable

## Video

- [x] Final concise English script — PASSED (168 words; conversational first-person cut)
- [x] ElevenLabs narration generated and inspected — PASSED (existing Damien Voice, Eleven Multilingual v2 recommended defaults, native 1.00 speed)
- [x] Genuine production-build browser footage captured — PASSED (native-compatible seven-tool harness, visible cursor and human clicks)
- [x] 1920×1080 render under 2:55 — PASSED (1:11.96, H.264/AAC)
- [x] Audio, loudness, captions, chronological transitions, first/final frames, and privacy inspected — PASSED (-16.2 LUFS, -1.3 dBTP)
- [x] Thumbnail 1280×720 inspected — PASSED
- [x] YouTube Public and signed-out URL verified — PASSED: https://youtu.be/ZLokWHrxxjI

## Devpost

- [x] English submission description drafted — PASSED locally
- [x] Live URL, public repository, and YouTube URL inserted — PASSED
- [x] Branded visual and built-with tags complete — PASSED on public page
- [x] No placeholders or unsupported claims — PASSED by public-page inspection
- [x] Final submitted state and public page verified — PASSED: https://devpost.com/software/arcadeops-relay
- [x] Confirmation URL, timestamp, and field snapshot saved — PASSED: `submission/devpost-submitted-snapshot.md`
