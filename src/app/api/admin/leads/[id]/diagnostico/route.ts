import { NextResponse } from "next/server";
import { runDiagnostico } from "@/lib/diagnostico";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const { blueprintId } = await runDiagnostico(id);
    return NextResponse.json({ blueprintId });
  } catch (e) {
    return serverError(e);
  }
}
