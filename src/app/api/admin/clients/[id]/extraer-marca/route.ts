import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../../_utils";
import { extraerMarca } from "@/lib/brand-extractor";
import { storageAvailable, uploadToTenant } from "@/lib/storage";

/**
 * Propone branding (colores, logo, estilo, nombre) a partir de la web o el IG
 * del negocio. NO aplica nada: el admin confirma en la UI. Toma web/instagram
 * del body, o si no vienen, del intake del lead asociado al cliente.
 */

const bodySchema = z.object({
  web: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(150).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await parseBody(req, bodySchema);
  if (error) return error;

  try {
    const client = await db.client.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    let web = data.web?.trim() || "";
    let instagram = data.instagram?.trim() || "";

    // Si no vinieron en el body, los buscamos en el intake del lead más reciente.
    if (!web && !instagram) {
      const lead = await db.lead.findFirst({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        select: { intake: true },
      });
      const intake = (lead?.intake as Record<string, unknown> | null) ?? null;
      if (intake) {
        if (typeof intake.web === "string") web = intake.web.trim();
        if (typeof intake.instagram === "string") instagram = intake.instagram.trim();
      }
    }

    if (!web && !instagram) {
      return NextResponse.json(
        {
          ok: false,
          motivo:
            "Este cliente no tiene web ni Instagram cargados. Cargá uno en el cuestionario o pasalo manualmente.",
        },
        { status: 200 }
      );
    }

    const result = await extraerMarca({ web, instagram });

    // Si trajo logo y hay storage, lo subimos a Cloudinary para tener una URL
    // estable (las de IG/web caducan o bloquean hotlinking). Best-effort.
    let logoUrl = result.logoUrl ?? null;
    if (result.ok && logoUrl && storageAvailable()) {
      try {
        const subido = await subirLogo(logoUrl, client.slug);
        if (subido) logoUrl = subido;
      } catch (e) {
        console.error("[extraer-marca] subir logo a Cloudinary falló", e);
        // dejamos la URL original como fallback
      }
    }

    return NextResponse.json({ ...result, logoUrl });
  } catch (e) {
    return serverError(e);
  }
}

const FETCH_TIMEOUT_MS = 7000;

async function subirLogo(url: string, slug: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 8_000_000) return null;
    const uploaded = await uploadToTenant({
      slug,
      scope: ["branding"],
      buffer: buf,
      originalName: "logo",
    });
    return uploaded.url;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
