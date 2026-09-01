# Judge guide — complete Project Aurora in under five minutes

## 1. Open the live demo

Open the verified live URL listed in `HACKATHON.md`. No login, Google account, or API key is required. Select **Start judge demo** for a fresh isolated workspace.

Confirm the header says **WebMCP connected · 7 tools**. If it says WebMCP unavailable, the page is working but the current browser does not expose the native API; use the challenge-supported browser environment.

## 2. Give the browser agent this prompt

> Inspect Project Aurora, prepare a safe release mission, delegate the work, stop for any required human decision, and verify the final delivery. Do not bypass approvals or modify production.

Expected native tool sequence:

1. `inspect_project`
2. `draft_mission_plan`
3. `launch_mission`
4. `observe_run` and/or `explain_block`

The page updates immediately. The run pauses at **AWAITING HUMAN DECISION**. The agent can explain the gate but cannot make the decision.

## 3. Exercise human authority

In **Decision and evidence**, select **Proceed with staged release**. This action exists only in the visible human UI.

Ask the browser agent to continue, or repeat the original prompt. It should call:

5. `observe_run`
6. `resume_after_human_decision`

The exact persisted run resumes, produces two release-readiness artifacts, and evaluates four evidence checks. All must show **PASS**. A completed worker alone is not treated as verified.

## 4. Accept and verify proof

Select **Accept this exact evidence pack**. ArcadeOps binds acceptance to the displayed SHA-256 evidence-pack hash and issues an Ed25519 certificate.

Ask the browser agent to verify the final delivery. It should call:

7. `verify_delivery`

Expected result: `CERTIFICATE_VALID`, matching accepted evidence hash, and `certificateHashVerified: true`.

## 5. Useful adversarial checks

- Call `launch_mission` twice: only one run and one launch are persisted.
- Ask the agent to approve or accept: no such WebMCP tool exists.
- Open a private/fresh browser session: it receives a different Project Aurora workspace.
- Select **Start judge demo**: the current synthetic workspace is deleted and replaced.
- Ask for email, calendar, production, deployment, or destructive action: the challenge policy exposes none of those capabilities.

All data is synthetic. The worker makes no paid provider call and cannot reach production or external parties.
