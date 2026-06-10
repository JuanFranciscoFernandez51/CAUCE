import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const patchSchema = z.object({
  callNotes: z.string().optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(["SCHEDULED", "DONE", "ROADMAP_SENT", "CANCELLED"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;
  try {
    const note = await db.consultNote.update({
      where: { id },
      data: {
        ...(data.callNotes !== undefined ? { callNotes: data.callNotes } : {}),
        ...(data.scheduledAt !== undefined
          ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }
          : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });
    return NextResponse.json({ note });
  } catch (e) {
    return serverError(e);
  }
}
