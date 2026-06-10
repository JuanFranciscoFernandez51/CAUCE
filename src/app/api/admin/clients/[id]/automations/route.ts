import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, parseBody, serverError } from "../../../_utils";

const createSchema = z.object({
  recipeId: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id: clientId } = await ctx.params;
  const { data, error } = await parseBody(req, createSchema);
  if (error) return error;
  try {
    const recipe = await db.recipe.findUnique({ where: { id: data.recipeId } });
    if (!recipe) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    // Toda automatización nace en TEST
    const automation = await db.automation.create({
      data: {
        clientId,
        recipeId: recipe.id,
        name: recipe.name,
        status: "TEST",
        health: "UNKNOWN",
      },
    });
    return NextResponse.json({ automation });
  } catch (e) {
    return serverError(e);
  }
}
