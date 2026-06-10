import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { n8nConfigured } from "@/lib/n8n";
import { aiAvailable } from "@/lib/anthropic";

export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json(
    {
      ok: dbOk,
      db: dbOk ? "up" : "down",
      n8n: n8nConfigured() ? "configurado" : "sin configurar",
      ia: aiAvailable() ? "configurada" : "sin configurar",
      ts: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 }
  );
}
