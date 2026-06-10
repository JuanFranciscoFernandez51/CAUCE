import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  rubro: z.string().max(200).nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  pack: z.enum(["NONE", "STARTER", "PRO", "SCALE", "CUSTOM"]).optional(),
  status: z.enum(["PROSPECT", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"]).optional(),
  mrr: z.number().min(0).optional(),
  costEstUsd: z.number().min(0).optional(),
  health: z.number().int().min(0).max(100).optional(),
  modules: z
    .array(z.enum(["crm", "turnos", "catalogo", "rrhh", "caja"]))
    .optional(),
  branding: z
    .object({
      displayName: z.string().max(200).optional(),
      primary: z.string().max(20).optional(),
      accent: z.string().max(20).optional(),
      logo: z.string().max(500).optional(),
    })
    .optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const client = await db.client.update({ where: { id }, data });
    return NextResponse.json({ client });
  } catch (e) {
    return serverError(e);
  }
}
