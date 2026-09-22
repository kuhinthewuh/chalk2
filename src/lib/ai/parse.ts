import { TutorResponseSchema, type TutorResponse } from "@/lib/contracts";

export type TutorParseResult =
  | { success: true; data: TutorResponse }
  | { success: false; error: string };

/** Strips ```json fences the model sometimes adds despite responseMimeType. */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function safeParseTutorResponse(raw: string): TutorParseResult {
  let json: unknown;
  try {
    json = JSON.parse(extractJsonText(raw));
  } catch (err) {
    return {
      success: false,
      error: `Response was not valid JSON: ${(err as Error).message}`,
    };
  }

  const result = TutorResponseSchema.safeParse(json);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}

/** Safe, valid TutorResponse used when recognition is too uncertain or repair fails. */
export function buildFallbackTutorResponse(): TutorResponse {
  return {
    recognizedContent: "",
    spokenResponse:
      "I couldn't read the board clearly. Could you rewrite the unclear part a little larger or darker?",
    canvasActions: [],
    confidence: 0.3,
  };
}

export function buildRepairPrompt(rawText: string, validationError: string): string {
  return `The following text was supposed to be a single JSON object matching the TutorResponse schema you were given, but it failed validation.

Validation error: ${validationError}

Original text:
${rawText}

Return ONLY the corrected JSON object matching the schema. Do not add commentary, explanation, or markdown fences. Preserve the original meaning and content as closely as possible while fixing the structural problem.`;
}

/** Given a rawText that failed validation, asks generateRepair for a fix exactly once. */
export type RepairGenerateFn = (repairPrompt: string) => Promise<string | undefined>;

/**
 * Attempts to parse rawText as a TutorResponse. If it fails validation,
 * calls generateRepair exactly once with a repair prompt, then re-validates.
 * Returns null if both the original and the repair attempt fail validation
 * (or generateRepair throws/returns nothing).
 *
 * generateRepair is injected (rather than calling the Gemini client
 * directly) so this orchestration logic is independently testable without
 * a live model call — see src/app/api/tutor/route.ts for the real wiring.
 */
export async function parseTutorResponseWithRepair(
  rawText: string,
  generateRepair: RepairGenerateFn,
): Promise<TutorResponse | null> {
  const initial = safeParseTutorResponse(rawText);
  if (initial.success) {
    return initial.data;
  }

  try {
    const repairedText = await generateRepair(buildRepairPrompt(rawText, initial.error));
    if (!repairedText) return null;

    const repaired = safeParseTutorResponse(repairedText);
    return repaired.success ? repaired.data : null;
  } catch {
    return null;
  }
}
