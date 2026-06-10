import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runQA } from "@/lib/provision";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const { passed } = await runQA(id);
    const checks = await db.qACheck.findMany({
      where: { automationId: id },
      orderBy: { runAt: "desc" },
      take: 6,
    });
    return NextResponse.json({ passed, checks });
  } catch (e) {
    return serverError(e);
  }
}
