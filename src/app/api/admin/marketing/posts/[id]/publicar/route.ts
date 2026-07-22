import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, serverError } from "../../../../_utils";
import { publicarPost } from "@/lib/marketing/publicar";

export const maxDuration = 300; // videos tardan en procesarse

/** Publicar AHORA (manual desde la lista). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const post = await db.mktPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
    if (post.status === "PUBLISHED") {
      return NextResponse.json({ error: "Ya está publicado" }, { status: 409 });
    }
    if (post.status === "PROCESSING") {
      return NextResponse.json({ error: "Se está publicando ahora" }, { status: 409 });
    }
    const updated = await publicarPost(id);
    if (updated.status === "FAILED") {
      return NextResponse.json(
        { error: updated.errorMessage ?? "No se pudo publicar", post: updated },
        { status: 502 }
      );
    }
    return NextResponse.json({ post: updated });
  } catch (e) {
    return serverError(e);
  }
}
