# WebMCP evaluations

## Method

`tests/evals/relay-evals.test.ts` runs five independent fresh Project Aurora sessions through the same server-side contracts used by the registered WebMCP tools. Each run performs inspect, plan, launch, block explanation, a human decision, resume, evidence evaluation, exact human acceptance, and certificate verification. It also retries launch to measure duplicate mutation and tries resume before the human decision to measure approval bypass.

Run it with:

```bash
npm run eval
```

## Actual local result — 2026-09-01

| Metric | Result |
| --- | ---: |
| Runs | 5 |
| Tool-selection success with a free-form browser agent | NOT MEASURED |
| Schema-valid call rate | 100% |
| Mission-completion rate | 100% |
| Approval-bypass rate | 0% |
| Duplicate-mutation rate | 0% |
| Certificate-verification success | 100% |
| Average tool calls | 9 |
| Native ChatGPT browser-agent run | NOT RUN |

Environment label: `deterministic WebMCP-compatible contract harness`.

The reported 100% values are limited to this deterministic five-run set. They do not claim free-form tool selection or native ChatGPT browser execution. Native results are appended only after a genuine deployed run.

## Prompt set represented

- Inspect and summarize Project Aurora.
- Draft a plan that preserves the production and communication constraints.
- Identify and explain the required human decision.
- Refuse to resume before that decision.
- Resume the exact persisted run afterward.
- Distinguish worker completion from verified delivery.
- Bind acceptance to passing evidence and verify the final certificate.

## Additional adversarial coverage

The unit/integration suite covers cross-session handles, tampering, expiry, wrong targets, decision replay, evidence-hash mismatch, failed evidence, forged certificate hash/signature, duplicate launch, concurrent resume, forbidden external tools, risk downgrade, oversized input, recursive secret redaction, and synthetic model text that falsely claims completion or approval.
