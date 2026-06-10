import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "APPROVED", "REJECTED"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const blueprint = await db.blueprint.update({ where: { id }, data: { status: data.status } });
    return NextResponse.json({ blueprint });
  } catch (e) {
    return serverError(e);
  }
}
