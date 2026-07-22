import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../../_utils";

const patchSchema = z.object({
  titulo: z.string().trim().min(1).max(120).optional(),
  caption: z.string().trim().min(1).max(2200).optional(),
  idea: z.string().trim().max(4000).nullable().optional(),
  mediaType: z.enum(["PHOTO", "PHOTO_CAROUSEL", "VIDEO", "REEL"]).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  videoUrls: z.array(z.string().url()).max(1).optional(),
  platforms: z.array(z.enum(["IG", "FB"])).min(1).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  cancelar: z.boolean().optional(),
});

/** Solo se editan posts que todavía no salieron. */
const EDITABLES = ["DRAFT", "PENDING", "FAILED", "CANCELLED"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const post = await db.mktPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    if (!EDITABLES.includes(post.status)) {
      return NextResponse.json({ error: "Ese post ya se publicó, no se edita" }, { status: 409 });
    }

    if (data.cancelar) {
      const updated = await db.mktPost.update({
        where: { id },
        data: { status: "CANCELLED", scheduledAt: null },
      });
      return NextResponse.json({ post: updated });
    }

    const { cancelar: _c, scheduledAt, ...rest } = data;
    void _c;
    const patch: Record<string, unknown> = { ...rest };
    if (scheduledAt !== undefined) {
      patch.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      patch.status = scheduledAt ? "PENDING" : "DRAFT";
      patch.errorMessage = null;
      patch.retryCount = 0;
    } else if (post.status === "FAILED" || post.status === "CANCELLED") {
      patch.status = post.scheduledAt ? "PENDING" : "DRAFT";
      patch.errorMessage = null;
      patch.retryCount = 0;
    }
    const updated = await db.mktPost.update({ where: { id }, data: patch });
    return NextResponse.json({ post: updated });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const post = await db.mktPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    if (post.status === "PUBLISHED" || post.status === "PARTIAL") {
      return NextResponse.json(
        { error: "Ya está publicado en IG — borralo desde Instagram si hace falta" },
        { status: 409 }
      );
    }
    await db.mktPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
