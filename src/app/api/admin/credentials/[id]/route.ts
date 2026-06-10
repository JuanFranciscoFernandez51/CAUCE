import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, serverError } from "../../_utils";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.credential.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
