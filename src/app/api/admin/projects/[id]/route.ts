import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  stage: z.enum(["LEAD", "DIAGNOSTICO", "APROBACION", "BUILD", "QA", "ONBOARDING", "ACTIVO"]).optional(),
  level: z.enum(["N1", "N2", "N3", "N4"]).optional(),
  setupFee: z.number().min(0).optional(),
  order: z.number().int().min(0).optional(),
  notes: z.string().max(5000).nullable().optional(),
  // ids de la columna destino en su nuevo orden (renumera todos)
  orderedIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const { orderedIds, ...fields } = data;
    const project = await db.project.update({ where: { id }, data: fields });
    if (orderedIds?.length) {
      await db.$transaction(
        orderedIds.map((pid, idx) =>
          db.project.update({ where: { id: pid }, data: { order: idx } })
        )
      );
    }
    return NextResponse.json({ project });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
