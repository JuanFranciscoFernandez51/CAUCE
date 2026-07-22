import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";
import { aiAvailable } from "@/lib/anthropic";
import { generarPublicaciones } from "@/lib/marketing/agente";

export const maxDuration = 120;

const schema = z.object({
  cantidad: z.number().int().min(1).max(10).default(5),
  brief: z.string().trim().max(500).optional(),
});

/** El agente genera un lote de publicaciones y las deja como borradores. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  if (!aiAvailable()) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 503 });
  }
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    const generadas = await generarPublicaciones(data.cantidad, data.brief);
    await db.mktPost.createMany({
      data: generadas.map((p) => ({
        titulo: p.titulo,
        caption: p.caption,
        idea: p.idea || null,
        mediaType: p.mediaType,
        platforms: ["IG"],
        status: "DRAFT",
        origen: "ia",
      })),
    });
    return NextResponse.json({ creadas: generadas.length });
  } catch (e) {
    return serverError(e);
  }
}
