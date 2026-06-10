import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  stage: z.enum(["LEAD", "DIAGNOSTICO", "APROBACION", "BUILD", "QA", "ONBOARDING", "ACTIVO"]).default("LEAD"),
  level: z.enum(["N1", "N2", "N3", "N4"]).default("N1"),
  setupFee: z.number().min(0).default(0),
  clientId: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const last = await db.project.findFirst({
      where: { stage: data.stage },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const project = await db.project.create({
      data: {
        title: data.title,
        stage: data.stage,
        level: data.level,
        setupFee: data.setupFee,
        clientId: data.clientId || null,
        leadId: data.leadId || null,
        notes: data.notes || null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json({ project });
  } catch (e) {
    return serverError(e);
  }
}
