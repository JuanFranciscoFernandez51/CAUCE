import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+$/, "Solo minúsculas y números"),
  rubro: z.string().max(200).nullable().optional(),
  pack: z.enum(["NONE", "STARTER", "PRO", "SCALE", "CUSTOM"]).default("NONE"),
  contactName: z.string().max(200).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
});

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const existing = await db.client.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: `El slug "${data.slug}" ya está en uso` }, { status: 409 });
    }
    const client = await db.client.create({
      data: {
        name: data.name,
        slug: data.slug,
        rubro: data.rubro || null,
        pack: data.pack,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
      },
    });
    return NextResponse.json({ client });
  } catch (e) {
    return serverError(e);
  }
}
