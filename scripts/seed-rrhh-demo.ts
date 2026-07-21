/**
 * Datos demo de RRHH para bahiamotos: 2 empleados + fichadas del mes.
 * Idempotente: si ya existen empleados con esos nombres, no duplica.
 */
import { db } from "../src/lib/db";

const SLUG = "bahiamotos";

function art(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-03:00`);
}

/** "YYYY-MM-DD" argentino de hoy - n días. */
function diasAtras(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

async function main() {
  const client = await db.client.findFirst({ where: { slug: SLUG } });
  if (!client) throw new Error(`No existe el tenant ${SLUG}`);

  const modules = (client.modules as string[] | null) ?? [];
  if (!modules.includes("rrhh")) {
    await db.client.update({
      where: { id: client.id },
      data: { modules: [...modules, "rrhh"] },
    });
    console.log("✅ módulo rrhh habilitado");
  }

  const EMPS = [
    { name: "Marcos Giménez", role: "Mecánico", phone: "2914111222" },
    { name: "Lucía Torres", role: "Atención y ventas", phone: "2914333444" },
  ];

  for (const e of EMPS) {
    const existing = await db.employee.findFirst({
      where: { clientId: client.id, name: e.name },
    });
    const emp =
      existing ??
      (await db.employee.create({
        data: { clientId: client.id, ...e, active: true },
      }));
    console.log(`👤 ${emp.name}${existing ? " (ya estaba)" : ""}`);

    const yaTiene = await db.timeEntry.count({
      where: { clientId: client.id, employeeId: emp.id },
    });
    if (yaTiene > 0) {
      console.log(`   ${yaTiene} fichadas existentes, no se agregan`);
      continue;
    }

    // Últimos 14 días: lunes a viernes, jornada partida con variación por día.
    const entries: { clockIn: Date; clockOut: Date | null }[] = [];
    for (let n = 14; n >= 1; n--) {
      const date = diasAtras(n);
      const wd = new Date(`${date}T12:00:00-03:00`).getUTCDay();
      if (wd === 0 || wd === 6) continue; // finde
      const mIn = 5 + ((n * 7) % 20); // variación de minutos determinística
      entries.push({
        clockIn: art(date, `08:${String(50 + (mIn % 10)).slice(0, 2)}`),
        clockOut: art(date, "13:00"),
      });
      entries.push({
        clockIn: art(date, "14:30"),
        clockOut: art(date, `18:${String(10 + (mIn % 30)).padStart(2, "0")}`),
      });
    }
    // Hoy: Marcos está trabajando (entrada abierta).
    if (e.name === "Marcos Giménez") {
      entries.push({ clockIn: art(diasAtras(0), "09:05"), clockOut: null });
    }

    await db.timeEntry.createMany({
      data: entries.map((t) => ({
        clientId: client.id,
        employeeId: emp.id,
        clockIn: t.clockIn,
        clockOut: t.clockOut,
        source: "web",
      })),
    });
    console.log(`   ${entries.length} fichadas creadas`);
  }
}

main()
  .then(() => console.log("🎉 seed RRHH listo"))
  .finally(() => db.$disconnect());
