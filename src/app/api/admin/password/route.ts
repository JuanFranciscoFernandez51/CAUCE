import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guard, parseBody, serverError } from "../_utils";

const schema = z.object({
  actual: z.string().min(1, "Falta la contraseña actual"),
  nueva: z.string().min(8, "La nueva debe tener al menos 8 caracteres").max(100),
});

/** El admin logueado cambia su propia contraseña (verifica la actual). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  try {
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const ok = await bcrypt.compare(data.actual, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.nueva, 10) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
