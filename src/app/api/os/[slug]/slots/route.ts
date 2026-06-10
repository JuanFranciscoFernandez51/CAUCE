import { NextResponse } from "next/server";
import { guardOsApi } from "../_guard";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";
import { getFreeSlots } from "@/app/os/[slug]/_lib/slots";

/** GET ?date=YYYY-MM-DD → { slots: [{ time, minutes }] } huecos libres del día. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;

  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido (YYYY-MM-DD)" }, { status: 400 });
  }

  const slots = await getFreeSlots(guard.tenant.id, date);
  return NextResponse.json({ slots });
}
