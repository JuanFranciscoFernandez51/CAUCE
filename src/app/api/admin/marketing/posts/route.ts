import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../_utils";

const createSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  caption: z.string().trim().min(1).max(2200),
  idea: z.string().trim().max(4000).optional(),
  mediaType: z.enum(["PHOTO", "PHOTO_CAROUSEL", "VIDEO", "REEL"]).default("PHOTO"),
  imageUrls: z.array(z.string().url()).max(10).default([]),
  videoUrls: z.array(z.string().url()).max(1).default([]),
  platforms: z.array(z.enum(["IG", "FB"])).min(1).default(["IG"]),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const g = await guard();
  if (g) return g;
  const posts = await db.mktPost.findMany({
    orderBy: [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const post = await db.mktPost.create({
      data: {
        titulo: data.titulo,
        caption: data.caption,
        idea: data.idea || null,
        mediaType: data.mediaType,
        imageUrls: data.imageUrls,
        videoUrls: data.videoUrls,
        platforms: data.platforms,
        scheduledAt,
        status: scheduledAt ? "PENDING" : "DRAFT",
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
