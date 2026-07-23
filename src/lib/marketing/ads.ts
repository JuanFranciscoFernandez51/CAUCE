import { db } from "@/lib/db";
import type { MktCampaign } from "@prisma/client";
import { getMktConfig, getPageToken, graphGet, graphPost, MetaError } from "./meta";

/**
 * Meta Ads para Cauce: 1 campaña = 1 adset + 1 ad (como la v1 de MF).
 * Todo nace PAUSED en Meta; activar requiere confirmación explícita.
 */

export type Audience = {
  ageMin: number;
  ageMax: number;
  genders: "all" | "hombres" | "mujeres";
  countries: string[]; // ["AR"]
  cities?: { key: string; radius?: number }[];
  interests?: { id: string; name: string }[];
};

const OPTIMIZATION_GOAL: Record<string, string> = {
  OUTCOME_TRAFFIC: "LINK_CLICKS",
  OUTCOME_LEADS: "OFFSITE_CONVERSIONS",
  OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",
  OUTCOME_AWARENESS: "REACH",
};

function targetingSpec(a: Audience): Record<string, unknown> {
  return {
    age_min: a.ageMin,
    age_max: a.ageMax,
    ...(a.genders === "hombres" ? { genders: [1] } : a.genders === "mujeres" ? { genders: [2] } : {}),
    geo_locations: {
      countries: a.countries,
      ...(a.cities?.length
        ? {
            cities: a.cities.map((c) => ({
              key: c.key,
              radius: c.radius ?? 40,
              distance_unit: "kilometer",
            })),
          }
        : {}),
    },
    ...(a.interests?.length ? { flexible_spec: [{ interests: a.interests }] } : {}),
    // v25+: sin esto Meta expande la audiencia por su cuenta.
    targeting_automation: { advantage_audience: 0 },
  };
}

async function requireAds(): Promise<{ token: string; adAccountId: string; pageId: string; igUserId: string | null }> {
  const config = await getMktConfig();
  const token = await getPageToken();
  if (!token) throw new MetaError("Meta no está conectado.");
  if (!config?.adAccountId) throw new MetaError("Falta configurar la cuenta publicitaria (act_…).");
  if (!config.pageId) throw new MetaError("Falta la página de Facebook conectada.");
  return {
    token,
    adAccountId: config.adAccountId,
    pageId: config.pageId,
    igUserId: config.igUserId,
  };
}

/** Crea campaign + adset + creative + ad en Meta, todo PAUSED. Guarda los IDs. */
export async function crearEnMeta(campaignId: string): Promise<MktCampaign> {
  const c = await db.mktCampaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new Error("Campaña no encontrada");
  const { token, adAccountId, pageId, igUserId } = await requireAds();
  const audience = c.audienceConfig as unknown as Audience;

  try {
    const campaign = (await graphPost(
      `/${adAccountId}/campaigns`,
      {
        name: c.name,
        objective: c.objective,
        status: "PAUSED",
        special_ad_categories: ["NONE"],
        buying_type: "AUCTION",
        is_adset_budget_sharing_enabled: false,
      },
      token
    )) as { id: string };

    const adset = (await graphPost(
      `/${adAccountId}/adsets`,
      {
        name: `${c.name} — conjunto`,
        campaign_id: campaign.id,
        daily_budget: c.dailyBudgetCents,
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        optimization_goal: OPTIMIZATION_GOAL[c.objective] ?? "LINK_CLICKS",
        start_time: c.startDate.toISOString(),
        end_time: c.endDate.toISOString(),
        targeting: targetingSpec(audience),
        status: "PAUSED",
      },
      token
    )) as { id: string };

    // Múltiples anuncios en el mismo conjunto (A/B: Meta reparte el presupuesto solo).
    const items = (c.adItems as AdItem[] | null) ?? [];
    if (items.length > 0) {
      const publicados: AdItem[] = [];
      for (const item of items) {
        const creativeId = await crearCreativeItem(c, item, { token, adAccountId, pageId, igUserId });
        const ad = (await graphPost(
          `/${adAccountId}/ads`,
          {
            name: `${c.name} — ${item.nombre}`,
            adset_id: adset.id,
            creative: { creative_id: creativeId },
            status: "PAUSED",
          },
          token
        )) as { id: string };
        publicados.push({ ...item, metaCreativeId: creativeId, metaAdId: ad.id });
      }
      return await db.mktCampaign.update({
        where: { id: c.id },
        data: {
          status: "IN_META_PAUSED",
          metaCampaignId: campaign.id,
          metaAdSetId: adset.id,
          adItems: JSON.parse(JSON.stringify(publicados)),
          errorMessage: null,
        },
      });
    }

    const creativeId = await crearCreative(c, { token, adAccountId, pageId, igUserId });

    const ad = (await graphPost(
      `/${adAccountId}/ads`,
      {
        name: `${c.name} — anuncio`,
        adset_id: adset.id,
        creative: { creative_id: creativeId },
        status: "PAUSED",
      },
      token
    )) as { id: string };

    return await db.mktCampaign.update({
      where: { id: c.id },
      data: {
        status: "IN_META_PAUSED",
        metaCampaignId: campaign.id,
        metaAdSetId: adset.id,
        metaAdId: ad.id,
        metaCreativeId: creativeId,
        errorMessage: null,
      },
    });
  } catch (e) {
    await db.mktCampaign.update({
      where: { id: c.id },
      data: { status: "FAILED", errorMessage: e instanceof Error ? e.message : "Error" },
    });
    throw e;
  }
}

export type AdItem = {
  nombre: string;
  videoUrl?: string;
  imageUrl?: string; // thumbnail para videos, o imagen del anuncio
  caption: string;
  metaCreativeId?: string;
  metaAdId?: string;
};

/** Creative de un item individual (video o foto) del conjunto multi-anuncio. */
async function crearCreativeItem(
  c: MktCampaign,
  item: AdItem,
  ctx: { token: string; adAccountId: string; pageId: string; igUserId: string | null }
): Promise<string> {
  const link = c.destinationUrl || "https://www.cauceapp.com.ar";
  let objectStorySpec: Record<string, unknown>;

  if (item.videoUrl) {
    const video = (await graphPost(
      `/${ctx.adAccountId}/advideos`,
      { file_url: item.videoUrl },
      ctx.token
    )) as { id: string };
    objectStorySpec = {
      page_id: ctx.pageId,
      video_data: {
        video_id: video.id,
        message: item.caption,
        ...(item.imageUrl ? { image_url: item.imageUrl } : {}),
        call_to_action: { type: c.creativeCallToAction, value: { link } },
      },
    };
  } else {
    if (!item.imageUrl) throw new MetaError(`El anuncio "${item.nombre}" no tiene video ni imagen`);
    objectStorySpec = {
      page_id: ctx.pageId,
      link_data: {
        link,
        message: item.caption,
        picture: item.imageUrl,
        call_to_action: { type: c.creativeCallToAction },
      },
    };
  }

  const params = (withIg: boolean) => ({
    name: `${c.name} — ${item.nombre} — creative`,
    object_story_spec: {
      ...objectStorySpec,
      ...(withIg && ctx.igUserId ? { instagram_user_id: ctx.igUserId } : {}),
    },
  });

  try {
    const r = (await graphPost(`/${ctx.adAccountId}/adcreatives`, params(true), ctx.token)) as {
      id: string;
    };
    return r.id;
  } catch (e) {
    if (e instanceof MetaError && e.code === 100 && e.subcode === 1487194) {
      const r = (await graphPost(`/${ctx.adAccountId}/adcreatives`, params(false), ctx.token)) as {
        id: string;
      };
      return r.id;
    }
    throw e;
  }
}

async function crearCreative(
  c: MktCampaign,
  ctx: { token: string; adAccountId: string; pageId: string; igUserId: string | null }
): Promise<string> {
  const link = c.destinationUrl || "https://www.cauceapp.com.ar";
  let objectStorySpec: Record<string, unknown>;

  if (c.creativeMediaType === "VIDEO" || c.creativeMediaType === "REEL") {
    if (!c.creativeVideoUrl) throw new MetaError("La campaña no tiene video");
    const video = (await graphPost(
      `/${ctx.adAccountId}/advideos`,
      { file_url: c.creativeVideoUrl },
      ctx.token
    )) as { id: string };
    objectStorySpec = {
      page_id: ctx.pageId,
      video_data: {
        video_id: video.id,
        message: c.creativeCaption,
        ...(c.creativeImageUrls[0] ? { image_url: c.creativeImageUrls[0] } : {}),
        call_to_action: { type: c.creativeCallToAction, value: { link } },
      },
    };
  } else if (c.creativeMediaType === "PHOTO_CAROUSEL" && c.creativeImageUrls.length > 1) {
    objectStorySpec = {
      page_id: ctx.pageId,
      link_data: {
        link,
        message: c.creativeCaption,
        child_attachments: c.creativeImageUrls.slice(0, 10).map((picture) => ({
          link,
          picture,
          call_to_action: { type: c.creativeCallToAction },
        })),
      },
    };
  } else {
    if (!c.creativeImageUrls[0]) throw new MetaError("La campaña no tiene imagen");
    objectStorySpec = {
      page_id: ctx.pageId,
      link_data: {
        link,
        message: c.creativeCaption,
        picture: c.creativeImageUrls[0],
        call_to_action: { type: c.creativeCallToAction },
      },
    };
  }

  const params = (withIg: boolean) => ({
    name: `${c.name} — creative`,
    object_story_spec: {
      ...objectStorySpec,
      ...(withIg && ctx.igUserId ? { instagram_user_id: ctx.igUserId } : {}),
    },
  });

  try {
    const r = (await graphPost(`/${ctx.adAccountId}/adcreatives`, params(true), ctx.token)) as {
      id: string;
    };
    return r.id;
  } catch (e) {
    // IG no vinculada a la ad account → reintento sin instagram_user_id.
    if (e instanceof MetaError && e.code === 100 && e.subcode === 1487194) {
      const r = (await graphPost(`/${ctx.adAccountId}/adcreatives`, params(false), ctx.token)) as {
        id: string;
      };
      return r.id;
    }
    throw e;
  }
}

/** Cambia el status en Meta de campaign + adset + todos los ads. */
async function setMetaStatus(c: MktCampaign, status: "ACTIVE" | "PAUSED", token: string) {
  const adIds = ((c.adItems as AdItem[] | null) ?? [])
    .map((i) => i.metaAdId)
    .filter((x): x is string => Boolean(x));
  for (const id of [c.metaCampaignId, c.metaAdSetId, c.metaAdId, ...adIds]) {
    if (id) await graphPost(`/${id}`, { status }, token);
  }
}

export async function activarCampaign(id: string): Promise<MktCampaign> {
  const c = await db.mktCampaign.findUnique({ where: { id } });
  if (!c?.metaCampaignId) throw new MetaError("La campaña no está en Meta todavía");
  const token = await getPageToken();
  if (!token) throw new MetaError("Meta no está conectado");
  await setMetaStatus(c, "ACTIVE", token);
  return db.mktCampaign.update({ where: { id }, data: { status: "ACTIVE", errorMessage: null } });
}

export async function pausarCampaign(id: string): Promise<MktCampaign> {
  const c = await db.mktCampaign.findUnique({ where: { id } });
  if (!c?.metaCampaignId) throw new MetaError("La campaña no está en Meta todavía");
  const token = await getPageToken();
  if (!token) throw new MetaError("Meta no está conectado");
  await setMetaStatus(c, "PAUSED", token);
  return db.mktCampaign.update({ where: { id }, data: { status: "PAUSED_BY_USER" } });
}

export async function syncInsights(id: string): Promise<MktCampaign> {
  const c = await db.mktCampaign.findUnique({ where: { id } });
  if (!c?.metaCampaignId) throw new MetaError("La campaña no está en Meta todavía");
  const token = await getPageToken();
  if (!token) throw new MetaError("Meta no está conectado");
  const r = (await graphGet(
    `/${c.metaCampaignId}/insights`,
    { fields: "reach,impressions,clicks,ctr,cpm,cpc,spend" },
    token
  )) as { data?: Record<string, unknown>[] };
  const row = r.data?.[0] ?? {};
  return db.mktCampaign.update({
    where: { id },
    data: {
      insightsCache: { ...row, syncedAt: new Date().toISOString() },
      lastSyncedAt: new Date(),
    },
  });
}

/** Lista las ad accounts del usuario conectado (para el wizard de setup). */
export async function listarAdAccounts(): Promise<
  { id: string; name: string; currency: string; accountStatus: number }[]
> {
  const token = await getPageToken();
  if (!token) throw new MetaError("Meta no está conectado");
  const r = (await graphGet(
    "/me/adaccounts",
    { fields: "id,account_id,name,currency,account_status" },
    token
  )) as { data?: { id: string; name: string; currency: string; account_status: number }[] };
  return (r.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    accountStatus: a.account_status,
  }));
}
