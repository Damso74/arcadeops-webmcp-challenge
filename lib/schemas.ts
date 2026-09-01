import { z } from "zod";

const noInput = z.object({}).strict();
const signedHandle = z.string().min(40).max(2048);

export const toolSchemas = {
  inspect_project: noInput,
  draft_mission_plan: z
    .object({
      objective: z.string().trim().min(10).max(500).optional(),
    })
    .strict(),
  launch_mission: z.object({ planHandle: signedHandle }).strict(),
  observe_run: z.object({ runHandle: signedHandle.optional() }).strict(),
  explain_block: z.object({ runHandle: signedHandle.optional() }).strict(),
  resume_after_human_decision: z
    .object({ runHandle: signedHandle, decisionRef: signedHandle })
    .strict(),
  verify_delivery: z.object({ runHandle: signedHandle.optional() }).strict(),
} as const;

export const humanActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("choose_release"),
      decisionRef: signedHandle,
      choice: z.enum(["staged_release", "postpone"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("accept_delivery"),
      acceptanceToken: signedHandle,
      evidencePackHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
]);
