import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, serverError } from "../../_utils";

/** Saca a alguien del equipo. Nunca deja el panel sin ningún admin. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const no = await guard();
  if (no) return no;
  const { id } = await params;
  try {
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return NextResponse.json({ error: "Tiene que quedar al menos un admin" }, { status: 400 });
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
