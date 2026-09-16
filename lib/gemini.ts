/**
 * Server-Side Gemini Client Singleton & Initialization Helper
 * 
 * Architecture & Design:
 * - Centralizes GoogleGenAI client configuration across the app.
 * - Adheres strictly to the guidelines: uses `process.env.GEMINI_API_KEY` server-side only.
 * - Employs lazy initialization so missing keys do not cause crash on startup.
 * - Provides helper to check if Gemini is available for real LLM reasoning or if
 *   fallback semantic logic should handle the query.
 */

import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

/**
 * Returns an instance of GoogleGenAI if GEMINI_API_KEY is configured in the environment.
 * Throws or returns null gracefully if missing.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}
