import Link from "next/link";
import { db } from "@/lib/db";
import { getMktConfigView } from "@/lib/marketing/meta";
import { AdsClient, type CampaignView } from "./ads-client";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const [config, campaigns] = await Promise.all([
    getMktConfigView(),
    db.mktCampaign.findMany({
      where: { status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const views: CampaignView[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    objective: c.objective,
    status: c.status,
    dailyBudgetArs: Math.round(c.dailyBudgetCents / 100),
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    creativeMediaType: c.creativeMediaType,
    creativeImageUrl: c.creativeImageUrls[0] ?? null,
    creativeCaption: c.creativeCaption,
    insights: (c.insightsCache as Record<string, string> | null) ?? null,
    errorMessage: c.errorMessage,
    enMeta: Boolean(c.metaCampaignId),
    adNames: ((c.adItems as { nombre: string }[] | null) ?? []).map((a) => a.nombre),
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/marketing" className="text-sm text-muted-foreground hover:text-foreground">
          ← Marketing
        </Link>
        <h1 className="text-2xl font-semibold">Meta Ads</h1>
        <p className="text-sm text-muted-foreground">
          Campañas publicitarias de Cauce. Todo nace pausado en Meta: activar es un paso aparte
          y con confirmación — nada gasta plata solo.
        </p>
      </div>
      <AdsClient
        campaigns={views}
        conectado={config.connected}
        adsReady={config.adsReady}
        adAccountId={config.adAccountId}
      />
    </div>
  );
}
