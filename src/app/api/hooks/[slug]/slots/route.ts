import { NextResponse } from "next/server";
import { guardHook } from "../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import { getFreeSlots } from "@/app/os/[slug]/_lib/slots";

/**
 * GET /api/hooks/[slug]/slots?date=YYYY-MM-DD
 * → { slots: ["09:00", "10:00", …] } huecos libres del día para el bot.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardHook(req, slug, "turnos");
  if (guard.error) return guard.error;

  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido (YYYY-MM-DD)" }, { status: 400 });
  }

  const free = await getFreeSlots(guard.tenant.id, date);
  return NextResponse.json({ slots: free.map((s) => s.time) });
}
