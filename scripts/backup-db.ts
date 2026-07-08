/**
 * Backup completo de la DB a JSON (todas las tablas, vía Prisma).
 * Uso: npx tsx scripts/backup-db.ts
 * Escribe en ../backups/backup-<fecha>.json (fuera del repo deployable).
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();

async function main() {
  const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const out: Record<string, unknown[]> = {};
  let total = 0;

  for (const name of models) {
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    const delegate = (db as unknown as Record<string, { findMany: (a?: object) => Promise<unknown[]> }>)[key];
    if (!delegate?.findMany) {
      console.warn(`(salteado: ${name})`);
      continue;
    }
    const rows = await delegate.findMany();
    out[name] = rows;
    total += rows.length;
    console.log(`${name}: ${rows.length}`);
  }

  const dir = join(__dirname, "..", "..", "backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const file = join(dir, `backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify(out, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  console.log(`\n✔ Backup: ${file} (${total} filas, ${models.length} tablas)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
