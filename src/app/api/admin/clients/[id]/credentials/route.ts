import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encryptJson } from "@/lib/crypto";
import { guard, parseBody, serverError } from "../../../_utils";

const createSchema = z.object({
  kind: z.enum(["whatsapp", "instagram", "sheets", "other"]),
  label: z.string().trim().min(1).max(200),
  data: z.string().trim().min(1).max(20000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id: clientId } = await ctx.params;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    // Si es JSON válido se guarda como objeto; si no, como texto. SIEMPRE cifrado.
    let payload: unknown = data.data;
    try {
      payload = JSON.parse(data.data);
    } catch {
      // texto plano, queda como string
    }
    const credential = await db.credential.create({
      data: {
        clientId,
        kind: data.kind,
        label: data.label,
        dataEnc: encryptJson(payload),
      },
    });
    // JAMÁS devolver dataEnc ni el plaintext
    return NextResponse.json({
      credential: { id: credential.id, kind: credential.kind, label: credential.label },
    });
  } catch (e) {
    return serverError(e);
  }
}
