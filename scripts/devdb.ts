/**
 * Postgres embebido para desarrollo (sin Docker ni Homebrew).
 * En producción se usa Neon: solo cambia DATABASE_URL en .env.
 *
 * Uso: npm run db:dev  (queda corriendo; Ctrl+C para frenar)
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".devdb");

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "cauce",
    password: "cauce",
    port: 5433,
    persistent: true,
  });

  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Inicializando cluster de Postgres embebido…");
    await pg.initialise();
  }

  await pg.start();

  const dbs = await pg.getPgClient();
  await dbs.connect();
  const res = await dbs.query("SELECT 1 FROM pg_database WHERE datname='cauce'");
  if (res.rowCount === 0) {
    await pg.createDatabase("cauce");
    console.log("Base de datos 'cauce' creada.");
  }
  await dbs.end();

  console.log("✅ Postgres dev corriendo en postgresql://cauce:cauce@localhost:5433/cauce");
  console.log("   Ctrl+C para frenar.");

  const stop = async () => {
    console.log("\nFrenando Postgres…");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  // mantener vivo
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
