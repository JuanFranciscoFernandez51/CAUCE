import { NextResponse } from "next/server";
import { aprobarBlueprint } from "@/lib/provision";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const { clientId } = await aprobarBlueprint(id);
    return NextResponse.json({ clientId });
  } catch (e) {
    return serverError(e);
  }
}
