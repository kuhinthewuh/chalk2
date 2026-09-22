import "server-only";
import { GoogleGenAI } from "@google/genai";

export class MissingApiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured on the server.");
    this.name = "MissingApiKeyError";
  }
}

let cachedClient: GoogleGenAI | null = null;

/** Lazily creates the server-only Gemini client. Never import this from client code. */
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}
