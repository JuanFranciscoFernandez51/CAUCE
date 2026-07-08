import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  nombre: z.string().trim().min(2).max(120).optional(),
  queHace: z.string().trim().min(2).max(500).optional(),
  cuando: z.string().trim().min(2).max(120).optional(),
  estado: z.enum(["ACTIVO", "PAUSADO"]).optional(),
});

/** Edita un proceso (texto o estado). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;

  try {
    const proceso = await db.proceso.update({ where: { id }, data });
    return NextResponse.json({ ok: true, proceso });
  } catch (e) {
    return serverError(e);
  }
}

/** Borra un proceso. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.proceso.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
