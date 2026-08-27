import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { esVidrios } from "@/lib/vidrios";
import { detectarTipo } from "@/lib/importador-vidrios";

export const runtime = "nodejs";
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Recibidor único del Stock: le tirás el archivo y él se da cuenta.
 *   - Pedido del proveedor  → suma cantidades y crea los códigos nuevos.
 *   - Lista de precios      → actualiza precios en masa por código.
 * Acepta PDF, CSV/TXT y planillas (xlsx/xls).
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const forzar = String(form?.get("tipo") ?? ""); // "pedido" | "precios" | ""
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un archivo" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 15 MB" }, { status: 400 });
  }

  // ── 1. Archivo → texto plano ────────────────────────────────────────────
  const buf = Buffer.from(await file.arrayBuffer());
  const nombre = file.name.toLowerCase();
  let texto = "";
  try {
    if (nombre.endsWith(".pdf")) {
      texto = (await new PDFParse({ data: buf }).getText()).text;
    } else if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
      const wb = XLSX.read(buf, { type: "buffer" });
      texto = wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n], { FS: ";" })).join("\n");
    } else {
      texto = buf.toString("utf8");
    }
  } catch {
    return NextResponse.json({ error: "No pude leer el archivo (¿es un PDF escaneado?)" }, { status: 400 });
  }

  // ── 2. ¿Qué es? ─────────────────────────────────────────────────────────
  const leido = detectarTipo(texto);
  const tipo = forzar === "pedido" || forzar === "precios" ? forzar : leido.tipo;
  if (tipo === "desconocido") {
    return NextResponse.json(
      { error: "No reconocí el archivo. Debe ser un pedido (cantidad + código) o una lista de precios (código + precio)." },
      { status: 400 }
    );
  }

  // ── 3. Aplicar ──────────────────────────────────────────────────────────
  if (tipo === "pedido") {
    let creados = 0;
    let actualizados = 0;
    for (const f of leido.pedido) {
      const slugProd = f.codigo.toLowerCase();
      const existe = await db.bazarProducto.findFirst({ where: { clientId: g.tenant.id, slug: slugProd } });
      if (existe) {
        await db.bazarProducto.update({ where: { id: existe.id }, data: { stock: existe.stock + f.cant } });
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
      tipo: "pedido",
      filas: leido.pedido.length,
      unidades: leido.pedido.reduce((a, f) => a + f.cant, 0),
      creados,
      actualizados,
      detalle: leido.pedido.slice(0, 300),
    });
  }

  // Lista de precios: actualiza por código; los que no existen se avisan.
  let tocados = 0;
  const faltantes: string[] = [];
  for (const f of leido.precios) {
    const existe = await db.bazarProducto.findFirst({
      where: { clientId: g.tenant.id, OR: [{ slug: f.codigo.toLowerCase() }, { sku: f.codigo }] },
    });
    if (!existe) {
      faltantes.push(f.codigo);
      continue;
    }
    await db.bazarProducto.update({
      where: { id: existe.id },
      data: {
        ...(f.precio != null ? { precio: f.precio } : {}),
        ...(f.precioSeguro != null ? { precioSeguro: f.precioSeguro } : {}),
        ...(f.precioSinMO != null ? { precioSinMO: f.precioSinMO } : {}),
      },
    });
    tocados++;
  }

  return NextResponse.json({
    ok: true,
    tipo: "precios",
    filas: leido.precios.length,
    actualizados: tocados,
    faltantes: faltantes.slice(0, 40),
    faltantesTotal: faltantes.length,
    detalle: leido.precios.slice(0, 300),
  });
}
