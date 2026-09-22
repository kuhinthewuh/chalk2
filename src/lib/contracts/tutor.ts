import { z } from "zod";

/**
 * FROZEN SHARED CONTRACT.
 * Committed once in the bootstrap commit per PLAN.md section 4/16.
 * No agent may change this file independently. If a change is required,
 * stop and report the requested change instead of editing it directly.
 */

export const TutorModeSchema = z.enum([
  "solve",
  "hint",
  "check",
  "explain",
  "physics",
]);
export type TutorMode = z.infer<typeof TutorModeSchema>;

export const NormalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type NormalizedPoint = z.infer<typeof NormalizedPointSchema>;

export const NormalizedBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});
export type NormalizedBox = z.infer<typeof NormalizedBoxSchema>;

const CanvasActionWriteSchema = z.object({
  type: z.literal("write"),
  text: z.string(),
  at: NormalizedPointSchema,
  size: z.enum(["sm", "md", "lg"]).optional(),
  delayMs: z.number().nonnegative().optional(),
});

const CanvasActionCircleSchema = z.object({
  type: z.literal("circle"),
  box: NormalizedBoxSchema,
  delayMs: z.number().nonnegative().optional(),
});

const CanvasActionUnderlineSchema = z.object({
  type: z.literal("underline"),
  from: NormalizedPointSchema,
  to: NormalizedPointSchema,
  delayMs: z.number().nonnegative().optional(),
});

const CanvasActionArrowSchema = z.object({
  type: z.literal("arrow"),
  from: NormalizedPointSchema,
  to: NormalizedPointSchema,
  label: z.string().optional(),
  delayMs: z.number().nonnegative().optional(),
});

const CanvasActionHighlightSchema = z.object({
  type: z.literal("highlight"),
  box: NormalizedBoxSchema,
  delayMs: z.number().nonnegative().optional(),
});

const CanvasActionEraseRegionSchema = z.object({
  type: z.literal("erase-region"),
  box: NormalizedBoxSchema,
  delayMs: z.number().nonnegative().optional(),
});

export const CanvasActionSchema = z.discriminatedUnion("type", [
  CanvasActionWriteSchema,
  CanvasActionCircleSchema,
  CanvasActionUnderlineSchema,
  CanvasActionArrowSchema,
  CanvasActionHighlightSchema,
  CanvasActionEraseRegionSchema,
]);
export type CanvasAction = z.infer<typeof CanvasActionSchema>;

export const PhysicsSceneSpecSchema = z.object({
  kind: z.literal("projectile"),
  initialSpeed: z.number(),
  launchAngleDeg: z.number(),
  gravity: z.number(),
  showTrajectory: z.boolean(),
  showVelocityVector: z.boolean(),
  showGravityVector: z.boolean(),
});
export type PhysicsSceneSpec = z.infer<typeof PhysicsSceneSpecSchema>;

export const TutorRequestSchema = z.object({
  mode: TutorModeSchema,
  canvasImageDataUrl: z.string(),
  userText: z.string(),
  conversationSummary: z.string().optional(),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const TutorResponseSchema = z.object({
  recognizedContent: z.string(),
  spokenResponse: z.string(),
  canvasActions: z.array(CanvasActionSchema),
  errorRegion: NormalizedBoxSchema.optional(),
  errorExplanation: z.string().optional(),
  physicsScene: PhysicsSceneSpecSchema.optional(),
  confidence: z.number().min(0).max(1),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;
