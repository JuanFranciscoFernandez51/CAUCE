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
    const crudo = (await req.json()) as Record<string, unknown>;
    // Solo los datos de empresa y textos. Los precios se guardan aparte
    // (/api/admin/precios) para que este formulario no los pise.
    const PERMITIDAS: (keyof Ajustes)[] = [
      "razonSocial", "cuit", "email", "whatsapp", "web", "direccion",
      "dolarArs", "validezDias", "condiciones", "firma",
    ];
    const datos = Object.fromEntries(
      Object.entries(crudo).filter(([k]) => (PERMITIDAS as string[]).includes(k))
    ) as Partial<Ajustes>;
    await guardarAjustes(datos);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
