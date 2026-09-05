import { GoogleGenAI } from '@google/genai';

/**
 * Returns a configured GoogleGenAI client instance using process.env.GEMINI_API_KEY.
 * Throws an error if the API key is not configured.
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Recommended default model for basic text, OCR, document analysis, and entity extraction.
 */
export const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Utility to retry AI calls on transient rate limits (429) or high demand (503).
 */
export const callWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1500
): Promise<T> => {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('ResourceExhausted')
      ) {
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError;
};

