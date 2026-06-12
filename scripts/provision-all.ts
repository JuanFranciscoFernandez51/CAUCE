/**
 * Provisión masiva: para cada automatización de cada cliente,
 * instancia el workflow en n8n (clon de la plantilla con las variables
 * del cliente), corre QA y activa. Idempotente.
 * Uso: npx tsx scripts/provision-all.ts
 */
import { PrismaClient } from "@prisma/client";
import { provisionar, runQA, activar } from "../src/lib/provision";

const db = new PrismaClient();

async function main() {
  const autos = await db.automation.findMany({
    include: { client: true, recipe: true },
    orderBy: [{ clientId: "asc" }],
  });
  console.log(`🌊 ${autos.length} automatizaciones en total\n`);

  let ok = 0, fail = 0;
  let lastClient = "";
  for (const a of autos) {
    if (a.client.slug !== lastClient) {
      lastClient = a.client.slug;
      console.log(`\n━━━ ${a.client.name} (${a.client.slug}) ━━━`);
    }
    try {
      if (!a.n8nWorkflowId) {
        const r = await provisionar(a.id);
        if (!r.ok) throw new Error(r.detail);
      }
      const qa = await runQA(a.id);
      await activar(a.id);
      ok++;
      const fresh = await db.automation.findUnique({ where: { id: a.id }, select: { n8nWorkflowId: true } });
      console.log(`  ✅ ${a.name} → wf ${fresh?.n8nWorkflowId} · QA ${qa.passed ? "pasó" : "con avisos"} · ACTIVA`);
    } catch (e) {
      fail++;
      console.log(`  ❌ ${a.name}: ${(e as Error).message.slice(0, 140)}`);
    }
  }
  console.log(`\n🌊 Provisión completa: ${ok} activas, ${fail} con error.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
