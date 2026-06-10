import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  status: z.enum(["NEW", "QUALIFIED", "CONVERTED", "LOST"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const lead = await db.lead.update({
      where: { id },
      data: { status: data.status, score: data.score },
    });
    return NextResponse.json({ lead });
  } catch (e) {
    return serverError(e);
  }
}
