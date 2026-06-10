import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  config: z.record(z.string(), z.string()).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const automation = await db.automation.update({
      where: { id },
      data: { name: data.name, config: data.config },
    });
    return NextResponse.json({ automation });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.automation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
