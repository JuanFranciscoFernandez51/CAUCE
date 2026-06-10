import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // deleteMany scopeado por clientId: imposible borrar credenciales ajenas
  const result = await db.credential.deleteMany({ where: { id, clientId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
