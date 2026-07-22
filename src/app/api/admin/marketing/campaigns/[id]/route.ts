import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../../_utils";
import {
  activarCampaign,
  crearEnMeta,
  pausarCampaign,
  syncInsights,
} from "@/lib/marketing/ads";
import { getPageToken, graphPost } from "@/lib/marketing/meta";

export const maxDuration = 120;

const accionSchema = z.object({
  accion: z.enum(["publicar", "activar", "pausar", "sync"]),
  confirm: z.boolean().optional(),
});

/** Acciones de campaña: publicar a Meta (PAUSED), activar (gasta plata), pausar, sync. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, accionSchema);
  if (error) return error;
  try {
    const c = await db.mktCampaign.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

    if (data.accion === "publicar") {
      if (c.status !== "DRAFT" && c.status !== "FAILED") {
        return NextResponse.json({ error: "Solo borradores o fallidas" }, { status: 409 });
      }
      return NextResponse.json({ campaign: await crearEnMeta(id) });
    }
    if (data.accion === "activar") {
      if (!data.confirm) {
        return NextResponse.json(
          { error: "Activar gasta plata — mandá confirm: true" },
          { status: 400 }
        );
      }
      return NextResponse.json({ campaign: await activarCampaign(id) });
    }
    if (data.accion === "pausar") {
      return NextResponse.json({ campaign: await pausarCampaign(id) });
    }
    return NextResponse.json({ campaign: await syncInsights(id) });
  } catch (e) {
    return serverError(e);
  }
}

/** Soft delete: pausa en Meta (best-effort) + status DELETED local. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const c = await db.mktCampaign.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (c.metaCampaignId) {
      try {
        const token = await getPageToken();
        if (token) await graphPost(`/${c.metaCampaignId}`, { status: "PAUSED" }, token);
      } catch {
        // best-effort: aunque falle la pausa remota, se marca borrada local
      }
    }
    await db.mktCampaign.update({ where: { id }, data: { status: "DELETED" } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
