/** Pedidos de ejemplo de Fernández Repuestos, para ver el tablero con datos reales. */
import { db } from "../src/lib/db";

const CLIENTES = [
  ["Marcos Villalba", "2914556677", "Bahía Blanca", "Zelarrayán 2140", "8000"],
  ["Carla Domínguez", "2915223344", "Punta Alta", "Colón 815", "8109"],
  ["Ariel Sosa", "2914889900", "Bahía Blanca", "Brown 455", "8000"],
  ["Nadia Ferreyra", "2916112233", "Coronel Suárez", "Rivadavia 1290", "7540"],
  ["Julián Ortega", "2914337788", "Monte Hermoso", "Costanera 78", "8153"],
  ["Rocío Medina", "2915667711", "Bahía Blanca", "Alsina 1620", "8000"],
  ["Damián Rearte", "2914992200", "Tres Arroyos", "San Martín 340", "7500"],
  ["Sofía Blanco", "2915448822", "Bahía Blanca", "Sarmiento 990", "8000"],
  ["Gonzalo Ibáñez", "2914775533", "Pigüé", "Belgrano 210", "8170"],
  ["Melina Cabrera", "2916339944", "Bahía Blanca", "Estomba 780", "8000"],
];

// estado, días atrás, retira en el local, seguimiento
const PLAN: [string, number, boolean, string | null][] = [
  ["NUEVO", 0, false, null],
  ["NUEVO", 1, true, null],
  ["NUEVO", 2, false, null],
  ["PAGADO", 1, false, null],
  ["PAGADO", 2, true, null],
  ["ESPERANDO", 3, false, null],
  ["ESPERANDO", 5, false, null],
  ["PREPARANDO", 2, false, null],
  ["DESPACHADO", 4, false, "CA372004518AR"],
  ["ENTREGADO", 9, false, "CA371885442AR"],
];

async function main() {
  const t = await db.client.findUnique({ where: { slug: "fernandezrepuestos" } });
  if (!t) throw new Error("falta el tenant");
  await db.bazarPedido.deleteMany({ where: { clientId: t.id } });

  const prods = await db.bazarProducto.findMany({ where: { clientId: t.id }, take: 60 });
  const envios = (t.settings as { envios?: { bahiaBlanca?: number; interior?: number; gratisDesde?: number } } | null)?.envios ?? {};

  let numero = 1001;
  for (let i = 0; i < PLAN.length; i++) {
    const [estado, dias, retira, seg] = PLAN[i];
    const [nombre, telefono, ciudad, direccion, cp] = CLIENTES[i];
    // 1 a 3 repuestos por pedido, tomados del catálogo real
    const cant = 1 + (i % 3);
    const elegidos = Array.from({ length: cant }, (_, k) => prods[(i * 7 + k * 11) % prods.length]);
    const items = elegidos.map((p) => ({ productoId: p.id, nombre: p.nombre, precio: p.precio, cant: 1 + ((p.precio + i) % 2), foto: null, sku: p.sku }));
    const subtotal = items.reduce((a, it) => a + it.precio * it.cant, 0);
    const envio = retira ? 0 : subtotal >= (envios.gratisDesde ?? 120000) ? 0 : ciudad === "Bahía Blanca" ? envios.bahiaBlanca ?? 4500 : envios.interior ?? 9800;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);

    await db.bazarPedido.create({
      data: {
        clientId: t.id,
        numero: numero++,
        items,
        subtotal,
        descuentoMonto: 0,
        envio,
        total: subtotal + envio,
        estado,
        nombre,
        telefono,
        email: null,
        direccion: retira ? null : direccion,
        ciudad: retira ? null : ciudad,
        cp: retira ? null : cp,
        retiroEnLocal: retira,
        seguimiento: seg,
        notas: estado === "ESPERANDO" ? "Pedido a Maxsa el lunes" : null,
        mpPaymentId: estado !== "NUEVO" && !retira ? `MP-${900000 + i}` : null,
        createdAt: fecha,
      },
    });
  }
  console.log(`✅ ${PLAN.length} pedidos de ejemplo`);
  process.exit(0);
}
main();
