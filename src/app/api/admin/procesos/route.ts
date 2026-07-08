import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const createSchema = z.object({
  clientId: z.string().min(1),
  nombre: z.string().trim().min(2).max(120),
  queHace: z.string().trim().min(2).max(500),
  cuando: z.string().trim().min(2).max(120),
});

/** Alta de un proceso para un cliente. */
export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;

  try {
    const max = await db.proceso.aggregate({
      where: { clientId: data.clientId },
      _max: { orden: true },
    });
    const proceso = await db.proceso.create({
      data: {
        clientId: data.clientId,
        nombre: data.nombre,
        queHace: data.queHace,
        cuando: data.cuando,
        estado: "ACTIVO",
        orden: (max._max.orden ?? -1) + 1,
      },
    });
    return NextResponse.json({ ok: true, proceso });
  } catch (e) {
    return serverError(e);
  }
}
