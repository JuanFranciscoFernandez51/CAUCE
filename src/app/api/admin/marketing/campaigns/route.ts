import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const MIN_BUDGET_ARS = Number(process.env.META_MIN_DAILY_BUDGET_ARS ?? 1000);

const audienceSchema = z.object({
  ageMin: z.number().int().min(18).max(65).default(25),
  ageMax: z.number().int().min(18).max(65).default(60),
  genders: z.enum(["all", "hombres", "mujeres"]).default("all"),
  countries: z.array(z.string().length(2)).min(1).default(["AR"]),
  cities: z.array(z.object({ key: z.string(), radius: z.number().optional() })).optional(),
  interests: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(150),
  objective: z.enum([
    "OUTCOME_TRAFFIC",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_LEADS",
    "OUTCOME_AWARENESS",
  ]),
  dailyBudgetArs: z.number().min(MIN_BUDGET_ARS, `Mínimo $${MIN_BUDGET_ARS}/día`),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  audience: audienceSchema,
  creativeMediaType: z.enum(["PHOTO", "PHOTO_CAROUSEL", "VIDEO", "REEL"]).default("PHOTO"),
  creativeImageUrls: z.array(z.string().url()).max(10).default([]),
  creativeVideoUrl: z.string().url().nullable().optional(),
  creativeCaption: z.string().trim().min(1).max(2200),
  creativeCallToAction: z
    .enum(["LEARN_MORE", "MESSAGE_PAGE", "WHATSAPP_MESSAGE", "CONTACT_US", "SIGN_UP"])
    .default("LEARN_MORE"),
  destinationUrl: z.string().url().nullable().optional(),
});

export async function GET() {
  const g = await guard();
  if (g) return g;
  const campaigns = await db.mktCampaign.findMany({
    where: { status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end.getTime() - start.getTime() < 24 * 3600_000) {
      return NextResponse.json({ error: "La campaña tiene que durar al menos 24 h" }, { status: 400 });
    }
    if (data.creativeMediaType === "VIDEO" || data.creativeMediaType === "REEL") {
      if (!data.creativeVideoUrl) {
        return NextResponse.json({ error: "Falta el video del anuncio" }, { status: 400 });
      }
    } else if (data.creativeImageUrls.length === 0) {
      return NextResponse.json({ error: "Falta la imagen del anuncio" }, { status: 400 });
    }
    const campaign = await db.mktCampaign.create({
      data: {
        name: data.name,
        objective: data.objective,
        dailyBudgetCents: Math.round(data.dailyBudgetArs * 100),
        startDate: start,
        endDate: end,
        audienceConfig: data.audience,
        creativeMediaType: data.creativeMediaType,
        creativeImageUrls: data.creativeImageUrls,
        creativeVideoUrl: data.creativeVideoUrl ?? null,
        creativeCaption: data.creativeCaption,
        creativeCallToAction: data.creativeCallToAction,
        destinationUrl: data.destinationUrl ?? null,
        status: "DRAFT",
      },
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
