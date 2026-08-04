import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Sin espacios ni símbolos raros"),
  email: z.union([z.literal(""), z.email()]).optional(),
  password: z.string().min(8, "Al menos 8 caracteres").max(100),
});

/** Alta de alguien del equipo de Cauce (usuario ADMIN del panel). */
export async function POST(req: Request) {
  const no = await guard();
  if (no) return no;
  const { data: d, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    const usado = await db.user.findUnique({ where: { username: d.username } });
    if (usado) return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 409 });

    const u = await db.user.create({
      data: {
        name: d.name,
        username: d.username,
        email: d.email || null,
        role: "ADMIN",
        passwordHash: await bcrypt.hash(d.password, 10),
      },
      select: { id: true, name: true, username: true },
    });
    return NextResponse.json(u, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
