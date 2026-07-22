import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";
import { listarAdAccounts } from "@/lib/marketing/ads";

export async function GET() {
  const g = await guard();
  if (g) return g;
  try {
    const accounts = await listarAdAccounts();
    return NextResponse.json({ accounts });
  } catch (e) {
    return serverError(e);
  }
}

const schema = z.object({
  adAccountId: z.string().regex(/^act_\d+$/, "Formato esperado: act_XXXXXXXX"),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    await db.mktConfig.upsert({
      where: { id: "default" },
      create: { id: "default", adAccountId: data.adAccountId },
      update: { adAccountId: data.adAccountId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
