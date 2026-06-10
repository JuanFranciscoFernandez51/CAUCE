import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const AREAS = ["ATENCION", "VENTAS_CRM", "MARKETING", "OPERACIONES", "TURNOS", "RRHH", "FINANZAS"] as const;
const LEVELS = ["N1", "N2", "N3", "N4"] as const;

const recipeSchema = z.object({
  name: z.string().min(2),
  area: z.enum(AREAS),
  level: z.enum(LEVELS),
  apps: z.array(z.string()).default([]),
  solves: z.string().min(2),
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
    .default([]),
  n8nTemplateId: z.string().nullable().optional(),
  buildHours: z.number().positive().default(2),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { data, error } = await parseBody(req, recipeSchema);
  if (error) return error;
  try {
    const recipe = await db.recipe.create({
      data: { ...data, n8nTemplateId: data.n8nTemplateId ?? null },
    });
    return NextResponse.json({ recipe });
  } catch (e) {
    return serverError(e);
  }
}
