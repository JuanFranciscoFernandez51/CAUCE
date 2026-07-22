import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, parseBody, serverError } from "../../_utils";
import { aiAvailable } from "@/lib/anthropic";
import { sugerirCaptionAd } from "@/lib/marketing/agente";

export const maxDuration = 60;

const schema = z.object({
  objetivo: z.string().trim().min(1).max(60),
  brief: z.string().trim().max(500).optional(),
});

/** Sugerir caption de anuncio con IA (botón ✨ del armador de ads). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  if (!aiAvailable()) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 503 });
  }
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    const caption = await sugerirCaptionAd(data.objetivo, data.brief);
    return NextResponse.json({ caption });
  } catch (e) {
    return serverError(e);
  }
}
