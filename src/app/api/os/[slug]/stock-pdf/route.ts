import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { esVidrios } from "@/lib/vidrios";
import { parsearPedidoMalatesta } from "@/lib/malatesta";

export const runtime = "nodejs";
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Importador de stock por PDF (pedidos de Malatesta): lee el PDF, saca
 * cantidad/código/descripción, deduce marca y categoría, y SUMA al stock.
 * Si el código no existe, crea el producto (precio 0 para completar después).
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un PDF válido" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El PDF supera los 15 MB" }, { status: 400 });
  }

  let texto = "";
  try {
    const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });
    texto = (await parser.getText()).text;
  } catch {
    return NextResponse.json({ error: "No pude leer el PDF (¿está escaneado como imagen?)" }, { status: 400 });
  }

  const filas = parsearPedidoMalatesta(texto);
  if (!filas.length) {
    return NextResponse.json({ error: "No encontré renglones de pedido en el PDF" }, { status: 400 });
  }

  let creados = 0;
  let actualizados = 0;
  for (const f of filas) {
    const slugProd = f.codigo.toLowerCase();
    const existe = await db.bazarProducto.findFirst({ where: { clientId: g.tenant.id, slug: slugProd } });
    if (existe) {
      await db.bazarProducto.update({
        where: { id: existe.id },
        data: {
          stock: existe.stock + f.cant,
          ...(existe.nombre.trim() ? {} : { nombre: f.descripcion }),
          ...(existe.marca ? {} : { marca: f.marca }),
        },
      });
      actualizados++;
    } else {
      await db.bazarProducto.create({
        data: {
          clientId: g.tenant.id,
          slug: slugProd,
          sku: f.codigo,
          nombre: f.descripcion,
          categoria: f.categoria,
          marca: f.marca,
          precio: 0,
          stock: f.cant,
          descripcion: "",
          activo: true,
          fotos: [],
        },
      });
      creados++;
    }
  }

  return NextResponse.json({
    ok: true,
    filas: filas.length,
    unidades: filas.reduce((a, f) => a + f.cant, 0),
    creados,
    actualizados,
    detalle: filas,
  });
}
