import { db } from "../src/lib/db";

async function main() {
  const c = await db.mktConfig.findUnique({ where: { id: "default" } });
  if (!c) return console.log("Sin config — no conectado");
  console.log({
    pageId: c.pageId,
    pageName: c.pageName,
    igUserId: c.igUserId,
    igUsername: c.igUsername,
    tieneToken: Boolean(c.pageAccessToken),
    scope: c.scope,
    expiresAt: c.expiresAt,
    actualizado: c.updatedAt,
  });
}

main().finally(() => db.$disconnect());
