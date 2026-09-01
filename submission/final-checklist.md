# Final release and submission checklist

Status values: `PASSED`, `FAILED`, or `NOT RUN` only.

## Product

- [ ] Live challenge page works from a fresh session — NOT RUN
- [ ] Native WebMCP detected — NOT RUN
- [ ] Seven tools invoked in a compatible browser agent — NOT RUN
- [ ] Full fresh Project Aurora scenario — PASSED locally through compatible harness
- [ ] Reset and cross-session isolation — PASSED locally
- [ ] Persisted worker terminal state — PASSED locally
- [ ] Four required evidence checks pass — PASSED locally
- [ ] Acceptance binds exact evidence hash — PASSED locally
- [ ] Certificate issues and verifies — PASSED locally
- [ ] No external action or production data — PASSED by code/tests; deployed verification NOT RUN

## Engineering gate

- [x] Lint — PASSED
- [x] Type check — PASSED
- [x] Unit/integration/evaluation tests — PASSED (14)
- [x] Browser E2E — PASSED (12)
- [x] Accessibility and responsive coverage — PASSED
- [x] Production build — PASSED
- [x] npm audit — PASSED (0 known vulnerabilities)
- [x] Source secret scan — PASSED
- [x] Prompt-only security scan contract finalized — PASSED (complete executable scope, 0 findings)
- [x] Clean public clone install/test/build — PASSED, including artifact route manifest
- [ ] Deployed smoke and full scenario — NOT RUN

## Public source

- [x] Separate repository public — PASSED: https://github.com/Damso74/arcadeops-webmcp-challenge
- [x] MIT license visible — PASSED locally
- [x] English README and judge guide — PASSED locally
- [x] Pre-existing versus challenge work documented — PASSED locally
- [x] Public history secret scan — PASSED with single-purpose new history and local equivalent scanner; gitleaks unavailable

## Video

- [x] Final English script, 270–330 words — PASSED (319 words)
- [ ] ElevenLabs narration generated and inspected — NOT RUN
- [ ] Genuine deployed browser footage captured — NOT RUN
- [ ] 1920×1080 render under 2:55 — NOT RUN
- [ ] Audio, loudness, captions, first/final frames, and privacy inspected — NOT RUN
- [ ] Thumbnail 1280×720 inspected — NOT RUN
- [ ] YouTube Public and signed-out URL verified — NOT RUN

## Devpost

- [x] English submission description drafted — PASSED locally
- [ ] Live URL, public repository, and YouTube URL inserted — NOT RUN
- [ ] Screenshots and built-with tags complete — NOT RUN
- [ ] No placeholders or unsupported claims — NOT RUN
- [ ] Final submitted state and public page verified — NOT RUN
- [ ] Confirmation URL, timestamp, and field snapshot saved — NOT RUN
