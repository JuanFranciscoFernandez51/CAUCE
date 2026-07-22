import { db } from "@/lib/db";
import type { MktPost } from "@prisma/client";
import {
  getMktConfig,
  getPageToken,
  graphGet,
  graphPost,
  igFriendly,
  waitForContainer,
  MetaError,
} from "./meta";

/**
 * Publicación real de un MktPost en IG (y cross-post a la página de FB).
 * Flujo IG: container(s) → polling → media_publish. Pausas de 400 ms entre fotos.
 */

type RefIg = { postId: string; permalink?: string };
export type PublishResult = {
  ig?: RefIg;
  fb?: { postId: string };
  errores: string[];
};

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function publicarIg(post: MktPost, igUserId: string, token: string): Promise<RefIg> {
  let creationId: string;

  if (post.mediaType === "VIDEO" || post.mediaType === "REEL") {
    const videoUrl = post.videoUrls[0];
    if (!videoUrl) throw new MetaError("El post no tiene video cargado");
    const r = (await graphPost(
      `/${igUserId}/media`,
      {
        media_type: "REELS",
        video_url: videoUrl,
        caption: post.caption,
        ...(post.mediaType === "REEL" ? { share_to_feed: true } : {}),
      },
      token
    )) as { id: string };
    await waitForContainer(r.id, token, 300_000); // videos tardan
    creationId = r.id;
  } else if (post.mediaType === "PHOTO_CAROUSEL" && post.imageUrls.length > 1) {
    const children: string[] = [];
    for (const url of post.imageUrls.slice(0, 10)) {
      const r = (await graphPost(
        `/${igUserId}/media`,
        { image_url: igFriendly(url), is_carousel_item: true },
        token
      )) as { id: string };
      children.push(r.id);
      await pausa(400);
    }
    for (const id of children) await waitForContainer(id, token, 30_000);
    const carrusel = (await graphPost(
      `/${igUserId}/media`,
      { media_type: "CAROUSEL", children: children.join(","), caption: post.caption },
      token
    )) as { id: string };
    await waitForContainer(carrusel.id, token, 60_000);
    creationId = carrusel.id;
  } else {
    const url = post.imageUrls[0];
    if (!url) throw new MetaError("El post no tiene imagen cargada");
    const r = (await graphPost(
      `/${igUserId}/media`,
      { image_url: igFriendly(url), caption: post.caption },
      token
    )) as { id: string };
    await waitForContainer(r.id, token, 30_000);
    creationId = r.id;
  }

  const pub = (await graphPost(`/${igUserId}/media_publish`, { creation_id: creationId }, token)) as {
    id: string;
  };

  let permalink: string | undefined;
  try {
    const p = (await graphGet(`/${pub.id}`, { fields: "permalink" }, token)) as {
      permalink?: string;
    };
    permalink = p.permalink;
  } catch {
    // best-effort
  }
  return { postId: pub.id, permalink };
}

async function publicarFb(post: MktPost, pageId: string, token: string): Promise<{ postId: string }> {
  if (post.mediaType === "VIDEO" || post.mediaType === "REEL") {
    const r = (await graphPost(
      `/${pageId}/videos`,
      { file_url: post.videoUrls[0], description: post.caption, published: true },
      token
    )) as { id: string };
    return { postId: r.id };
  }
  const r = (await graphPost(
    `/${pageId}/photos`,
    { url: post.imageUrls[0], caption: post.caption, published: true },
    token
  )) as { id: string };
  return { postId: r.id };
}

/**
 * Publica el post en las plataformas elegidas y actualiza su estado en DB.
 * Devuelve el post actualizado.
 */
export async function publicarPost(postId: string): Promise<MktPost> {
  const post = await db.mktPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post no encontrado");

  const config = await getMktConfig();
  const token = await getPageToken();
  if (!config?.igUserId || !token) {
    throw new MetaError("Meta no está conectado — conectá la cuenta desde Marketing.");
  }

  await db.mktPost.update({ where: { id: post.id }, data: { status: "PROCESSING" } });

  const result: PublishResult = { errores: [] };
  if (post.platforms.includes("IG")) {
    try {
      result.ig = await publicarIg(post, config.igUserId, token);
    } catch (e) {
      result.errores.push(`IG: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  if (post.platforms.includes("FB") && config.pageId) {
    try {
      result.fb = await publicarFb(post, config.pageId, token);
    } catch (e) {
      result.errores.push(`FB: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  const publicoAlgo = Boolean(result.ig || result.fb);
  return db.mktPost.update({
    where: { id: post.id },
    data: publicoAlgo
      ? {
          status: result.errores.length > 0 ? "PARTIAL" : "PUBLISHED",
          publishedAt: new Date(),
          publishedRefs: JSON.parse(JSON.stringify({ ig: result.ig, fb: result.fb })),
          errorMessage: result.errores.length > 0 ? result.errores.join(" · ") : null,
        }
      : {
          status: "FAILED",
          errorMessage: result.errores.join(" · ") || "No se pudo publicar",
          retryCount: { increment: 1 },
        },
  });
}
