import Anthropic from "@anthropic-ai/sdk";
import { analysisSchema, type Analysis } from "../types";
import { CLAUDE_TIMEOUT_MS, MODEL_ANALYZE } from "../config";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { fallbackAnalyze } from "./fallback";

export type AnalyzeSource = "ai" | "fallback";

export interface AnalyzeResult {
  analysis: Analysis;
  source: AnalyzeSource;
}

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
}

// Claude bazen ```json ... ``` ile sarar; temizle.
function stripMarkdownFence(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  // İlk { ... son } arasını al (önlem).
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s.trim();
}

function parseAnalysis(raw: string): Analysis {
  const cleaned = stripMarkdownFence(raw);
  const json = JSON.parse(cleaned);
  return analysisSchema.parse(json);
}

async function callClaudeOnce(text: string): Promise<Analysis> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: CLAUDE_TIMEOUT_MS,
  });

  const response = await client.messages.create({
    model: MODEL_ANALYZE,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(text) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response contained no text block");
  }
  return parseAnalysis(textBlock.text);
}

/**
 * Kullanıcı metnini analiz eder.
 * - API anahtarı yoksa: deterministik yedek analizci.
 * - API anahtarı varsa: Claude'a sorar; JSON parse hatasında 1 kez retry;
 *   yine başarısızsa yedek analizciye düşer (zarif degradasyon).
 */
export async function analyzeText(text: string): Promise<AnalyzeResult> {
  if (!hasApiKey()) {
    return { analysis: fallbackAnalyze(text), source: "fallback" };
  }

  try {
    const analysis = await callClaudeOnce(text);
    return { analysis, source: "ai" };
  } catch (err) {
    // 1 kez retry (JSON parse / geçici hata).
    console.error("[analyze] first attempt failed, retrying:", (err as Error).message);
    try {
      const analysis = await callClaudeOnce(text);
      return { analysis, source: "ai" };
    } catch (err2) {
      console.error("[analyze] retry failed, using fallback:", (err2 as Error).message);
      return { analysis: fallbackAnalyze(text), source: "fallback" };
    }
  }
}
