import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const AREAS = ["ATENCION", "VENTAS_CRM", "MARKETING", "OPERACIONES", "TURNOS", "RRHH", "FINANZAS"] as const;
const LEVELS = ["N1", "N2", "N3", "N4"] as const;

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  area: z.enum(AREAS).optional(),
  level: z.enum(LEVELS).optional(),
  apps: z.array(z.string()).optional(),
  solves: z.string().min(2).optional(),
  variables: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        type: z.string().default("text"),
        required: z.boolean().default(false),
        help: z.string().optional(),
      })
    )
    .optional(),
  n8nTemplateId: z.string().nullable().optional(),
  buildHours: z.number().positive().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const recipe = await db.recipe.update({ where: { id }, data });
    return NextResponse.json({ recipe });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const inUse = await db.automation.count({ where: { recipeId: id } });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `No se puede borrar: ${inUse} automatización(es) usan esta receta. Desactivala en su lugar.` },
        { status: 409 }
      );
    }
    await db.recipe.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
