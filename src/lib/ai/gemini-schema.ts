import { Type, type Schema } from "@google/genai";

/**
 * Gemini structured-output schema mirroring the frozen TutorResponse Zod
 * contract (src/lib/contracts/tutor.ts). This only steers the model toward
 * the right shape — the Zod schema in parse.ts is the actual gate.
 */

const normalizedPoint: Schema = {
  type: Type.OBJECT,
  properties: {
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
  },
  required: ["x", "y"],
};

const normalizedBox: Schema = {
  type: Type.OBJECT,
  properties: {
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
    width: { type: Type.NUMBER },
    height: { type: Type.NUMBER },
  },
  required: ["x", "y", "width", "height"],
};

const canvasActionWrite: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["write"] },
    text: { type: Type.STRING },
    at: normalizedPoint,
    size: { type: Type.STRING, enum: ["sm", "md", "lg"] },
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "text", "at"],
};

const canvasActionCircle: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["circle"] },
    box: normalizedBox,
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "box"],
};

const canvasActionUnderline: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["underline"] },
    from: normalizedPoint,
    to: normalizedPoint,
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "from", "to"],
};

const canvasActionArrow: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["arrow"] },
    from: normalizedPoint,
    to: normalizedPoint,
    label: { type: Type.STRING },
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "from", "to"],
};

const canvasActionHighlight: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["highlight"] },
    box: normalizedBox,
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "box"],
};

const canvasActionEraseRegion: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["erase-region"] },
    box: normalizedBox,
    delayMs: { type: Type.NUMBER },
  },
  required: ["type", "box"],
};

const physicsSceneSpec: Schema = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING, enum: ["projectile"] },
    initialSpeed: { type: Type.NUMBER },
    launchAngleDeg: { type: Type.NUMBER },
    gravity: { type: Type.NUMBER },
    showTrajectory: { type: Type.BOOLEAN },
    showVelocityVector: { type: Type.BOOLEAN },
    showGravityVector: { type: Type.BOOLEAN },
  },
  required: [
    "kind",
    "initialSpeed",
    "launchAngleDeg",
    "gravity",
    "showTrajectory",
    "showVelocityVector",
    "showGravityVector",
  ],
};

export const TUTOR_RESPONSE_GEMINI_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    recognizedContent: { type: Type.STRING },
    spokenResponse: { type: Type.STRING },
    canvasActions: {
      type: Type.ARRAY,
      items: {
        anyOf: [
          canvasActionWrite,
          canvasActionCircle,
          canvasActionUnderline,
          canvasActionArrow,
          canvasActionHighlight,
          canvasActionEraseRegion,
        ],
      },
    },
    errorRegion: normalizedBox,
    errorExplanation: { type: Type.STRING },
    physicsScene: physicsSceneSpec,
    confidence: { type: Type.NUMBER },
  },
  required: ["recognizedContent", "spokenResponse", "canvasActions", "confidence"],
};
