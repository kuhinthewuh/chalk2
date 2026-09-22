import { NextRequest, NextResponse } from "next/server";
import { TutorRequestSchema, type TutorResponse } from "@/lib/contracts";
import { getGeminiClient, MissingApiKeyError } from "@/lib/ai/client";
import {
  GEMINI_MODEL_ID,
  GENERATION_TEMPERATURE,
  REPAIR_TEMPERATURE,
  MAX_CANVAS_IMAGE_BYTES,
} from "@/lib/ai/config";
import { buildTutorSystemPrompt, buildTutorUserPrompt } from "@/lib/ai/prompts";
import { buildFallbackTutorResponse, parseTutorResponseWithRepair } from "@/lib/ai/parse";
import { TUTOR_RESPONSE_GEMINI_SCHEMA } from "@/lib/ai/gemini-schema";
import type { TutorErrorResponse } from "@/lib/ai/errors";

const DATA_URL_PATTERN = /^data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

/** The one live repair call parseTutorResponseWithRepair may make on malformed output. */
async function generateRepairText(repairPrompt: string): Promise<string | undefined> {
  const genAI = getGeminiClient();
  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL_ID,
    contents: [{ role: "user", parts: [{ text: repairPrompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: TUTOR_RESPONSE_GEMINI_SCHEMA,
      temperature: REPAIR_TEMPERATURE,
    },
  });
  return response.text;
}

function errorResponse(
  status: number,
  code: TutorErrorResponse["error"],
  message: string,
): NextResponse<TutorErrorResponse> {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_request", "Request body must be valid JSON.");
  }

  const parsedRequest = TutorRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(
      400,
      "invalid_request",
      `Request did not match the expected shape: ${parsedRequest.error.message}`,
    );
  }
  const { mode, canvasImageDataUrl, userText, conversationSummary } = parsedRequest.data;

  const dataUrlMatch = DATA_URL_PATTERN.exec(canvasImageDataUrl);
  if (!dataUrlMatch) {
    return errorResponse(
      400,
      "invalid_image",
      "canvasImageDataUrl must be a base64-encoded image data URL (data:image/<type>;base64,...).",
    );
  }
  const [, imageSubtype, base64Data] = dataUrlMatch;
  const mimeType = `image/${imageSubtype}`;

  const approxDecodedBytes = Math.floor((base64Data.length * 3) / 4);
  if (approxDecodedBytes > MAX_CANVAS_IMAGE_BYTES) {
    return errorResponse(
      413,
      "image_too_large",
      `Canvas image is too large (${approxDecodedBytes} bytes). Limit is ${MAX_CANVAS_IMAGE_BYTES} bytes.`,
    );
  }

  const systemPrompt = buildTutorSystemPrompt(mode);
  const userPrompt = buildTutorUserPrompt(userText, conversationSummary);

  let rawText: string | undefined;
  try {
    const genAI = getGeminiClient();
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }, { inlineData: { mimeType, data: base64Data } }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: TUTOR_RESPONSE_GEMINI_SCHEMA,
        temperature: GENERATION_TEMPERATURE,
      },
    });
    rawText = response.text;
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      console.error("[api/tutor] Gemini client misconfigured:", err.message);
      return errorResponse(
        500,
        "server_misconfigured",
        "The tutor service is not configured correctly.",
      );
    }
    console.error("[api/tutor] Gemini request failed:", err);
    return errorResponse(
      502,
      "model_unavailable",
      "The tutor could not process this request right now. Please try again.",
    );
  }

  if (!rawText) {
    console.error("[api/tutor] Gemini returned an empty response.");
    return NextResponse.json<TutorResponse>(buildFallbackTutorResponse(), { status: 200 });
  }

  const repaired = await parseTutorResponseWithRepair(rawText, generateRepairText);
  if (!repaired) {
    console.error("[api/tutor] Model output failed validation even after repair attempt.");
    return NextResponse.json<TutorResponse>(buildFallbackTutorResponse(), { status: 200 });
  }

  return NextResponse.json<TutorResponse>(repaired, { status: 200 });
}
