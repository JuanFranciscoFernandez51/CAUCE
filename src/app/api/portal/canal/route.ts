import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { encryptJson } from "@/lib/crypto";

const canalSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("whatsapp"),
    token: z.string().trim().min(10, "El token de Meta no parece válido"),
    phoneNumberId: z.string().trim().min(4, "Falta el phone number ID"),
    verifyToken: z.string().trim().max(200).optional().default(""),
  }),
  z.object({
    kind: z.literal("instagram"),
    token: z.string().trim().min(10, "El token no parece válido"),
    pageId: z.string().trim().min(4, "Falta el page ID"),
  }),
]);

export async function POST(req: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = canalSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const label =
    data.kind === "whatsapp"
      ? `WhatsApp …${data.phoneNumberId.slice(-4)}`
      : "Instagram";

  // El payload completo va SIEMPRE cifrado; jamás se guarda ni devuelve plano.
  const dataEnc =
    data.kind === "whatsapp"
      ? encryptJson({
          token: data.token,
          phoneNumberId: data.phoneNumberId,
          verifyToken: data.verifyToken || null,
        })
      : encryptJson({ token: data.token, pageId: data.pageId });

  const cred = await db.credential.create({
    data: { clientId, kind: data.kind, label, dataEnc },
    select: { id: true, kind: true, label: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, credential: cred });
}
