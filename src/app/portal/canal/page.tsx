import { db } from "@/lib/db";
import { getPortalClient, fmtDate } from "../_lib";
import { CanalManager } from "./canal-manager";

export default async function CanalPage() {
  const client = await getPortalClient();
  if (!client) return null;

  const credentials = await db.credential.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, label: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Canal del bot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conectá el WhatsApp Business o Instagram donde tu bot va a atender.
        </p>
      </div>
      <CanalManager
        credentials={credentials.map((c) => ({
          id: c.id,
          kind: c.kind,
          label: c.label,
          createdAt: fmtDate(c.createdAt),
        }))}
      />
    </div>
  );
}
