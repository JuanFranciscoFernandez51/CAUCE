import { NextResponse } from "next/server";
import { generarRoadmap } from "@/lib/roadmap";
import { guard, serverError } from "../../../_utils";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g) return g;
  const { id } = await ctx.params;
  try {
    const { roadmapId } = await generarRoadmap(id);
    return NextResponse.json({ ok: true, roadmapId });
  } catch (e) {
    return serverError(e);
  }
}
