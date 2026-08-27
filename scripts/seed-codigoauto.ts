import { PrismaClient } from "@prisma/client";

/**
 * Seed inicial de Código Auto (template vidrios):
 * - proveedor Malatesta (el mayorista principal de vidrios)
 * - unos productos de muestra en los dos grupos (Parabrisas / Repuestos)
 *   con el formato que pidió el cliente: código, marca, descripción, cantidad.
 * Idempotente: no duplica si ya existe.
 */
const db = new PrismaClient();

const STOCK: { sku: string; nombre: string; categoria: string; marca: string; precio: number; stock: number; descripcion: string }[] = [
  { sku: "PB-VW-GOL5", nombre: "Parabrisas VW Gol Trend 2013-2023", categoria: "Parabrisas", marca: "VW", precio: 185000, stock: 3, descripcion: "Vidrio laminado con banda sombreada." },
  { sku: "PB-FI-CRO", nombre: "Parabrisas Fiat Cronos 2018-2025", categoria: "Parabrisas", marca: "Fiat", precio: 210000, stock: 2, descripcion: "Vidrio laminado, apto sensor de lluvia." },
  { sku: "PB-TO-HIL8", nombre: "Parabrisas Toyota Hilux 2016-2024", categoria: "Parabrisas", marca: "Toyota", precio: 265000, stock: 1, descripcion: "Vidrio laminado con antena integrada." },
  { sku: "PB-PE-208", nombre: "Parabrisas Peugeot 208 2020-2025", categoria: "Parabrisas", marca: "Peugeot", precio: 232000, stock: 4, descripcion: "Vidrio laminado original de reposición." },
  { sku: "RP-BUR-GOL", nombre: "Burlete de parabrisas VW Gol", categoria: "Repuestos", marca: "VW", precio: 28000, stock: 8, descripcion: "Burlete perimetral de goma." },
  { sku: "RP-MOL-HIL", nombre: "Moldura superior Toyota Hilux", categoria: "Repuestos", marca: "Toyota", precio: 36000, stock: 2, descripcion: "Moldura embellecedora superior." },
];

async function main() {
  const tenant = await db.client.findUnique({ where: { slug: "codigoauto" }, select: { id: true } });
  if (!tenant) throw new Error("No existe el tenant codigoauto");

  // Proveedor principal: Malatesta.
  const malatesta = await db.proveedor.findFirst({ where: { clientId: tenant.id, nombre: "Malatesta" } });
  if (!malatesta) {
    await db.proveedor.create({
      data: {
        clientId: tenant.id,
        nombre: "Malatesta",
        categoria: "insumos",
        rubro: "Vidrios y parabrisas",
        detalle: "Proveedor principal de parabrisas y cristales",
        activo: true,
      },
    });
    console.log("✔ Proveedor Malatesta creado");
  } else {
    console.log("· Malatesta ya existía");
  }

  // Stock de muestra (slug único por tenant).
  for (const p of STOCK) {
    const slug = p.sku.toLowerCase();
    const existe = await db.bazarProducto.findFirst({ where: { clientId: tenant.id, slug } });
    if (existe) continue;
    await db.bazarProducto.create({
      data: {
        clientId: tenant.id,
        slug,
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria,
        marca: p.marca,
        precio: p.precio,
        stock: p.stock,
        descripcion: p.descripcion,
        activo: true,
      },
    });
    console.log(`✔ ${p.sku} — ${p.nombre}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
