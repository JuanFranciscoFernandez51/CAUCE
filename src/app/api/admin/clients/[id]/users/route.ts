import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../../_utils";

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9._-]+$/, "Solo minúsculas, números, punto, guión"),
  name: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id: clientId } = await ctx.params;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const existing = await db.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: `El usuario "${data.username}" ya existe` }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        username: data.username,
        name: data.name,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: "CLIENT",
        clientId,
      },
    });
    return NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name },
    });
  } catch (e) {
    return serverError(e);
  }
}
