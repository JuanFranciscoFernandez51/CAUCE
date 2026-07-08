import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
      ia: aiAvailable() ? "configurada" : "sin configurar",
      ts: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 }
  );
}
