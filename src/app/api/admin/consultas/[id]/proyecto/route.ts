import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RoadmapContent } from "@/lib/roadmap";
import type { Level } from "@prisma/client";
import { guard, serverError } from "../../../_utils";

/** Convierte la consultoría (con roadmap) en un proyecto del pipeline, en Aprobación. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const note = await db.consultNote.findUniqueOrThrow({
      where: { id },
      include: { lead: true, roadmap: true },
    });
    const existing = await db.project.findFirst({ where: { leadId: note.leadId } });
    if (existing) {
      return NextResponse.json({ ok: true, projectId: existing.id, existed: true });
    }

    // nivel y setup de la primera fase del roadmap si existe
    let level: Level = "N3";
    let setupFee = 0;
    const content = note.roadmap?.content as RoadmapContent | undefined;
    const fase1 = content?.fases?.[0];
    if (fase1) {
      setupFee = fase1.precioEstimadoUsd?.setup ?? 0;
      const niveles = fase1.items.map((i) => i.nivel).filter((n) => /^N[1-4]$/.test(n)) as Level[];
      if (niveles.length) level = niveles.sort().at(-1) as Level;
    }

    const project = await db.project.create({
      data: {
        title: `${note.lead.business || note.lead.name} — roadmap consultoría`,
        stage: "APROBACION",
        level,
        setupFee,
        leadId: note.leadId,
        notes: content?.resumen ?? null,
      },
    });
    await db.lead.update({ where: { id: note.leadId }, data: { status: "QUALIFIED" } });
    return NextResponse.json({ ok: true, projectId: project.id });
  } catch (e) {
    return serverError(e);
  }
}
