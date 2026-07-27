import { NextResponse } from "next/server";
import { cookieSesion } from "@/lib/bazar-server";

/** Cierra la sesión del comprador: borra la cookie del sitio. */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieSesion(slug), "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
