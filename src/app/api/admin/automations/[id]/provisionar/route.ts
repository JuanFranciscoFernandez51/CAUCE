import { NextResponse } from "next/server";
import { provisionar } from "@/lib/provision";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    // ok:false NO es error: es estado claro (n8n sin configurar / receta sin template)
    const result = await provisionar(id);
    return NextResponse.json(result);
  } catch (e) {
    return serverError(e);
  }
}
