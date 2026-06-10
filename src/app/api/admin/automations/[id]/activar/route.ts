import { NextResponse } from "next/server";
import { activar } from "@/lib/provision";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await activar(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
