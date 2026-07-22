/**
 * Proveedores reales de Ave Fénix, sacados de su libro diario 2026.
 * Idempotente: no duplica por nombre.
 */
import { db } from "../src/lib/db";

const PROVEEDORES = [
  { nombre: "EDES Melón", categoria: "servicio", detalle: "Luz de las pantallas (Melón)", montoMensual: 320000, diaPago: 5 },
  { nombre: "Alquiler Alsina", categoria: "alquiler", detalle: "Local Alsina", montoMensual: 400000, diaPago: 10 },
  { nombre: "Alquiler Melón", categoria: "alquiler", detalle: "Espacio Melón", montoMensual: 402000, diaPago: 9 },
  { nombre: "Luz / Agua / Gas Alsina", categoria: "servicio", detalle: "Servicios del local", montoMensual: 35000, diaPago: 11 },
  { nombre: "Internet Alsina", categoria: "servicio", detalle: "Conectividad local y pantallas", montoMensual: 13000, diaPago: 6 },
  { nombre: "Personal (teléfonos)", categoria: "servicio", detalle: "Líneas móviles", montoMensual: 29000, diaPago: 23 },
  { nombre: "Vodafone", categoria: "servicio", detalle: "Línea/datos", montoMensual: 18000, diaPago: 5 },
  { nombre: "Disney+", categoria: "contenido", detalle: "Contenido para pantallas", montoMensual: 18000, diaPago: 8 },
  { nombre: "Google (almacenamiento)", categoria: "servicio", detalle: "Almacenamiento en la nube", montoMensual: 3700, diaPago: 6 },
  { nombre: "Apple (almacenamiento)", categoria: "servicio", detalle: "Almacenamiento en la nube", montoMensual: 1500, diaPago: 9 },
  { nombre: "Monotributo", categoria: "impuestos", detalle: "AFIP/ARCA", montoMensual: 52000, diaPago: 20 },
  { nombre: "Seguro moto", categoria: "servicio", detalle: "Seguro del vehículo", montoMensual: 36000, diaPago: 19 },
] as const;

async function main() {
  const client = await db.client.findUnique({ where: { slug: "avefenix" } });
  if (!client) throw new Error("Falta el tenant avefenix");

  let creados = 0;
  for (let i = 0; i < PROVEEDORES.length; i++) {
    const p = PROVEEDORES[i];
    const existe = await db.proveedor.findFirst({
      where: { clientId: client.id, nombre: p.nombre },
    });
    if (existe) continue;
    await db.proveedor.create({
      data: { clientId: client.id, ...p, orden: i },
    });
    creados++;
  }
  const total = await db.proveedor.aggregate({
    where: { clientId: client.id, activo: true },
    _sum: { montoMensual: true },
  });
  console.log(`✅ ${creados} proveedores creados · gasto mensual $${Math.round(total._sum.montoMensual ?? 0).toLocaleString("es-AR")}`);
}

main().finally(() => db.$disconnect());
