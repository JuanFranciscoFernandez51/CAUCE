import Anthropic from "@anthropic-ai/sdk";

// Lazy init: el build de Vercel no debe fallar si falta la key.
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY");
  }
  if (!client) client = new Anthropic();
  return client;
}

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Modelos: bots de clientes en Haiku (barato, con prompt caching);
// diagnóstico/roadmap en Sonnet (criterio).
export const MODEL_BOT = "claude-haiku-4-5-20251001";
export const MODEL_AGENT = "claude-sonnet-4-6";
