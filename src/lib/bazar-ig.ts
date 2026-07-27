import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { graphPost, igFriendly, waitForContainer, MetaError } from "@/lib/marketing/meta";
import { fotosDe } from "@/lib/bazar";

/**
 * Instagram del TENANT bazar (patrón lib/marketing adaptado a tokens por cliente).
 * La conexión vive en Client.settings.ig = { igUserId, igUsername, tokenEnc }
 * con el page token cifrado con lib/crypto. La conexión real (OAuth del
 * Business del cliente) la hace Fran; acá solo se consume.
 */

export type IgConexion = {
  igUserId: string;
  igUsername: string | null;
  token: string;
};

export function igConexionDe(tenant: Client): IgConexion | null {
  const ig = (tenant.settings as {
    ig?: { igUserId?: string; igUsername?: string; tokenEnc?: string };
  } | null)?.ig;
  if (!ig?.igUserId || !ig.tokenEnc) return null;
  try {
    return {
      igUserId: ig.igUserId,
      igUsername: ig.igUsername ?? null,
      token: decrypt(ig.tokenEnc),
    };
  } catch {
    return null; // rotó ENCRYPTION_KEY → reconectar
  }
}

/**
 * Publica una BazarPublicacion como carrusel (o foto única) en el IG del tenant
 * y actualiza su estado. Devuelve la publicación actualizada.
 */
export async function publicarBazarPublicacion(pubId: string) {
  const pub = await db.bazarPublicacion.findUnique({
    where: { id: pubId },
    include: { client: true },
  });
  if (!pub) throw new Error("Publicación no encontrada");

  const conexion = igConexionDe(pub.client);
  if (!conexion) {
    return db.bazarPublicacion.update({
      where: { id: pub.id },
      data: { estado: "ERROR", error: "Instagram no está conectado — conectalo desde el módulo." },
    });
  }

  try {
    const fotos = fotosDe(pub.fotos).slice(0, 10);
    if (fotos.length === 0) throw new MetaError("La publicación no tiene fotos");

    let creationId: string;
    if (fotos.length === 1) {
      const r = (await graphPost(
        `/${conexion.igUserId}/media`,
        { image_url: igFriendly(fotos[0]), caption: pub.caption },
        conexion.token
      )) as { id: string };
      await waitForContainer(r.id, conexion.token, 30_000);
      creationId = r.id;
    } else {
      const children: string[] = [];
      for (const url of fotos) {
        const r = (await graphPost(
          `/${conexion.igUserId}/media`,
          { image_url: igFriendly(url), is_carousel_item: true },
          conexion.token
        )) as { id: string };
        children.push(r.id);
        await new Promise((res) => setTimeout(res, 400));
      }
      for (const id of children) await waitForContainer(id, conexion.token, 30_000);
      const carrusel = (await graphPost(
        `/${conexion.igUserId}/media`,
        { media_type: "CAROUSEL", children: children.join(","), caption: pub.caption },
        conexion.token
      )) as { id: string };
      await waitForContainer(carrusel.id, conexion.token, 60_000);
      creationId = carrusel.id;
    }

    await graphPost(
      `/${conexion.igUserId}/media_publish`,
      { creation_id: creationId },
      conexion.token
    );

    return db.bazarPublicacion.update({
      where: { id: pub.id },
      data: { estado: "PUBLICADA", publicadaEn: new Date(), error: null },
    });
  } catch (e) {
    return db.bazarPublicacion.update({
      where: { id: pub.id },
      data: {
        estado: "ERROR",
        error: e instanceof Error ? e.message : "Error publicando en Instagram",
      },
    });
  }
}
