/**
 * Single source of truth for the Gemini model ID. No other file in this
 * codebase may hardcode a model string — import GEMINI_MODEL_ID instead.
 *
 * If this model is unavailable on the team's API key, change only this
 * constant.
 */
export const GEMINI_MODEL_ID = "gemini-2.5-flash";

/** Max accepted size of the decoded canvas image, in bytes. */
export const MAX_CANVAS_IMAGE_BYTES = 8 * 1024 * 1024;

/** Sampling temperature for the primary tutor generation call. */
export const GENERATION_TEMPERATURE = 0.4;

/** Sampling temperature for the single structured-output repair attempt. */
export const REPAIR_TEMPERATURE = 0.1;
