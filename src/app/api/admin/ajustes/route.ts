import { NextResponse } from "next/server";
import { guard, serverError } from "../_utils";
import { getAjustes, guardarAjustes, type Ajustes } from "@/lib/ajustes";

export async function GET() {
  const no = await guard();
  if (no) return no;
  return NextResponse.json(await getAjustes());
}

export async function PUT(req: Request) {
  const no = await guard();
  if (no) return no;
  try {
    const datos = (await req.json()) as Partial<Ajustes>;
    await guardarAjustes(datos);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
