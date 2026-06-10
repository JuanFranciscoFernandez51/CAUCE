import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../_utils";

const packSchema = z.object({
  label: z.string().min(1),
  tagline: z.string(),
  setupUsd: z.number().min(0).nullable(),
  setupFrom: z.boolean(),
  monthlyUsd: z.number().min(0).nullable(),
  monthlyFrom: z.boolean(),
  fairUseMsgs: z.number().min(0).nullable(),
  features: z.array(z.string()),
});

const schema = z.object({
  dolarArs: z.number().positive(),
  ivaPct: z.number().min(0).max(100),
  roadmapPriceUsd: z.number().min(0),
  roadmapCredit: z.boolean(),
  packs: z.object({
    starter: packSchema,
    pro: packSchema,
    scale: packSchema,
    custom: packSchema,
  }),
  modulePricing: z.record(
    z.string(),
    z.object({ label: z.string(), monthlyUsd: z.number().min(0) })
  ),
});

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    await db.pricingConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
