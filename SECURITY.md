# Security policy

## Supported version

The deployed challenge version and the current `main` branch of this repository receive security fixes through the challenge judging period.

## Reporting

Please do not include secrets, personal data, or exploit traffic against the public judge service in a report. Open a private GitHub security advisory for the public repository. Do not use a public issue for an unpatched vulnerability.

## Judge-environment security model

- Every workspace contains synthetic Project Aurora data only.
- A random public session ID is carried inside an HMAC-signed, expiring, HTTP-only, SameSite=Strict cookie.
- Plan, run, decision, and acceptance references are signed, target-bound, session-bound, versioned, and expiring.
- SQLite `BEGIN IMMEDIATE` transactions serialize state transitions; revision checks prevent lost updates.
- Idempotency keys and state invariants prevent duplicate launches, resumes, decisions, evidence packs, and certificates.
- Mutation routes enforce same-origin browser signals and bounded JSON bodies.
- Server-side Zod schemas reject unknown fields and oversized handles.
- Rate limits apply to session creation, tools, and human actions using both session and request fingerprint where relevant.
- WebMCP does not expose decision or acceptance operations.
- The human UI route requires a separate route and current signed authority handle. The visible-UI header is defense in depth, not a claim of unforgeable physical presence.
- The challenge policy denies email, calendar, finance, deployment, production mutation, and destructive tools.
- No user-supplied URL, command, HTML, or executable input reaches the deterministic worker.
- Application state—not model text—is authoritative.
- Artifact access is session-scoped and returns private, non-cacheable responses.
- Evidence acceptance is bound to an exact SHA-256 pack hash.
- Certificates are signed with a persisted Ed25519 key pair stored in the isolated data volume.

## Deployment assumptions

The supported deployment is one non-root container, one persistent private volume, and a trusted TLS reverse proxy. The application port binds only to loopback. `RELAY_SESSION_SECRET` must be at least 32 characters and supplied out of band. The reverse proxy must overwrite forwarding headers and rate-limit abusive connection floods. SQLite and the built-in limiter are not intended for horizontal multi-instance deployment.

## Out of scope

- Production ArcadeOps systems and the private ArcadeOps repository.
- Social engineering or denial of service requiring distributed traffic beyond the stated single-instance challenge capacity.
- Browser or platform vulnerabilities outside this application.
- Issuer identity trust obtained from an untrusted copy of both a certificate and its embedded public key. Signature verification establishes integrity; trusted issuer identity requires a trusted key fingerprint.

## Verification commands

```bash
npm audit --audit-level=low
npm run scan:secrets
npm test
npm run test:e2e
npm run build
```
