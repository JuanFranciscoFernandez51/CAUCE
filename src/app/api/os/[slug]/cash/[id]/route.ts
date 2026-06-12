import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "caja");
  if (guard.error) return guard.error;

  // deleteMany scopeado por clientId: imposible borrar movimientos de otro tenant.
  const result = await db.cashMovement.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
