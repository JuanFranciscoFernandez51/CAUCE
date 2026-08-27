/**
 * Carga un pedido de Malatesta (PDF) al stock de Código Auto.
 * Uso: npx tsx scripts/importar-malatesta.ts <ruta-al-pdf>
 */
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { PrismaClient } from "@prisma/client";
import { parsearPedidoMalatesta } from "../src/lib/malatesta";

for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i < 1 || l.trim().startsWith("#")) continue;
  process.env[l.slice(0, i).trim()] ||= l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
}

async function main() {
  const ruta = process.argv[2];
  if (!ruta) throw new Error("Falta la ruta al PDF");
  const db = new PrismaClient();

  const parser = new PDFParse({ data: fs.readFileSync(ruta) });
  const texto = (await parser.getText()).text;
  const filas = parsearPedidoMalatesta(texto);
  console.log("renglones:", filas.length, "| unidades:", filas.reduce((a, f) => a + f.cant, 0));
  console.log("categorias:", [...new Set(filas.map((f) => f.categoria))].join(", "));
  console.log("marcas:", [...new Set(filas.map((f) => f.marca))].join(", "));

  const t = await db.client.findFirst({ where: { slug: "codigoauto" } });
  if (!t) throw new Error("No existe el tenant codigoauto");

  let creados = 0;
  let actualizados = 0;
  for (const f of filas) {
    const slugProd = f.codigo.toLowerCase();
    const existe = await db.bazarProducto.findFirst({ where: { clientId: t.id, slug: slugProd } });
    if (existe) {
      await db.bazarProducto.update({ where: { id: existe.id }, data: { stock: existe.stock + f.cant } });
      actualizados++;
    } else {
      await db.bazarProducto.create({
        data: {
          clientId: t.id,
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
  console.log("creados:", creados, "| actualizados:", actualizados);
  console.log("productos totales:", await db.bazarProducto.count({ where: { clientId: t.id } }));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
