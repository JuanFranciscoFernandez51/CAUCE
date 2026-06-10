import { NextResponse } from "next/server";
import { generateMonthlyReport } from "@/lib/reports";
import { guard, serverError } from "../../../_utils";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id: clientId } = await ctx.params;
  try {
    let period: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.period === "string" && /^\d{4}-\d{2}$/.test(body.period)) {
        period = body.period;
      }
    } catch {
      // sin body → período actual
    }
    const { reportId } = await generateMonthlyReport(clientId, period);
    return NextResponse.json({ reportId });
  } catch (e) {
    return serverError(e);
  }
}
