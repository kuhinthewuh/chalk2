import assert from "node:assert/strict";
import { TutorRequestSchema, TutorResponseSchema } from "@/lib/contracts";
import { buildTutorSystemPrompt } from "@/lib/ai/prompts";
import {
  safeParseTutorResponse,
  buildFallbackTutorResponse,
  parseTutorResponseWithRepair,
} from "@/lib/ai/parse";

/**
 * Lightweight assertion-based test runner for src/lib/ai/**.
 * Run with `npm run test:ai`. Covers what can be verified without a live
 * GEMINI_API_KEY / network call — see AGENT_CLAUDE_AI.md's testing
 * checklist and the handoff notes for the remaining live-server checks.
 */

const tests: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) {
  tests.push([name, fn]);
}

test("a linear equation solve-mode request parses", () => {
  const result = TutorRequestSchema.safeParse({
    mode: "solve",
    canvasImageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    userText: "Solve 2x + 3 = 7",
  });
  assert.equal(result.success, true);
});

test("hint mode system prompt instructs the model to avoid the final answer", () => {
  const prompt = buildTutorSystemPrompt("hint");
  assert.match(prompt, /not reveal the final answer/i);
  assert.match(prompt, /one concise/i);
});

test("check mode system prompt supports returning an error region", () => {
  const prompt = buildTutorSystemPrompt("check");
  assert.match(prompt, /errorRegion/);
  assert.match(prompt, /earliest likely/i);

  const sample = TutorResponseSchema.safeParse({
    recognizedContent: "2x + 3 = 7 -> 2x = 4 -> x = 8",
    spokenResponse: "There's an issue in the last step.",
    canvasActions: [
      { type: "circle", box: { x: 0.1, y: 0.5, width: 0.3, height: 0.1 } },
    ],
    errorRegion: { x: 0.1, y: 0.5, width: 0.3, height: 0.1 },
    errorExplanation: "Dividing 4 by 2 gives 2, not 8.",
    confidence: 0.8,
  });
  assert.equal(sample.success, true);
});

test("physics mode system prompt states the exact PLAN.md defaults and schema produces PhysicsSceneSpec", () => {
  const prompt = buildTutorSystemPrompt("physics");
  assert.match(prompt, /initialSpeed=20/);
  assert.match(prompt, /launchAngleDeg=45/);
  assert.match(prompt, /gravity=9\.81/);

  const sample = TutorResponseSchema.safeParse({
    recognizedContent: "Projectile sketch with launch angle and curved path.",
    spokenResponse: "Here's the projectile motion, launched at 45 degrees.",
    canvasActions: [],
    physicsScene: {
      kind: "projectile",
      initialSpeed: 20,
      launchAngleDeg: 45,
      gravity: 9.81,
      showTrajectory: true,
      showVelocityVector: true,
      showGravityVector: true,
    },
    confidence: 0.75,
  });
  assert.equal(sample.success, true);
});

test("well-formed JSON parses without needing a repair call", async () => {
  const validRaw = JSON.stringify({
    recognizedContent: "2x + 3 = 7",
    spokenResponse: "Let's isolate x.",
    canvasActions: [],
    confidence: 0.9,
  });
  let repairCalls = 0;
  const result = await parseTutorResponseWithRepair(validRaw, async () => {
    repairCalls += 1;
    return undefined;
  });
  assert.equal(repairCalls, 0);
  assert.ok(result);
  assert.equal(result?.recognizedContent, "2x + 3 = 7");
});

test("malformed output triggers exactly one repair attempt and succeeds if the repair is valid", async () => {
  const malformedRaw = "not json at all";
  const validRepaired = JSON.stringify({
    recognizedContent: "2x + 3 = 7",
    spokenResponse: "Let's isolate x.",
    canvasActions: [],
    confidence: 0.9,
  });
  let repairCalls = 0;
  const result = await parseTutorResponseWithRepair(malformedRaw, async () => {
    repairCalls += 1;
    return validRepaired;
  });
  assert.equal(repairCalls, 1);
  assert.ok(result);
  assert.equal(result?.recognizedContent, "2x + 3 = 7");
});

test("malformed output that fails repair too gives up after exactly one attempt (returns null)", async () => {
  const malformedRaw = "not json at all";
  let repairCalls = 0;
  const result = await parseTutorResponseWithRepair(malformedRaw, async () => {
    repairCalls += 1;
    return "still not json";
  });
  assert.equal(repairCalls, 1);
  assert.equal(result, null);
});

test("safeParseTutorResponse extracts JSON from a ```json fenced response", () => {
  const fenced = "```json\n" + JSON.stringify({
    recognizedContent: "x = 2",
    spokenResponse: "Done.",
    canvasActions: [],
    confidence: 0.95,
  }) + "\n```";
  const result = safeParseTutorResponse(fenced);
  assert.equal(result.success, true);
});

test("the fallback response is always a valid, low-confidence TutorResponse", () => {
  const fallback = buildFallbackTutorResponse();
  const result = TutorResponseSchema.safeParse(fallback);
  assert.equal(result.success, true);
  assert.ok(fallback.confidence < 0.55);
});

async function main() {
  let passed = 0;
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`ok - ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`FAIL - ${name}`);
      console.error(err);
      failed += 1;
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
