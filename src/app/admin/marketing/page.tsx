import { db } from "@/lib/db";
import { getMktConfigView } from "@/lib/marketing/meta";
import { Stat } from "@/components/ui";
import { ConexionMeta } from "./conexion-meta";
import { FeedMarketing, type PostView } from "./feed-marketing";

export const dynamic = "force-dynamic";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ meta_ok?: string; meta_error?: string }>;
}) {
  const sp = await searchParams;
  const [config, posts] = await Promise.all([
    getMktConfigView(),
    db.mktPost.findMany({
      orderBy: [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const stats = {
    borradores: posts.filter((p) => p.status === "DRAFT").length,
    programados: posts.filter((p) => p.status === "PENDING").length,
    publicados: posts.filter((p) => p.status === "PUBLISHED" || p.status === "PARTIAL").length,
    conError: posts.filter((p) => p.status === "FAILED").length,
  };

  const postViews: PostView[] = posts.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    caption: p.caption,
    idea: p.idea,
    mediaType: p.mediaType,
    imageUrls: p.imageUrls,
    videoUrls: p.videoUrls,
    platforms: p.platforms,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    status: p.status,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    permalink:
      (p.publishedRefs as { ig?: { permalink?: string } } | null)?.ig?.permalink ?? null,
    errorMessage: p.errorMessage,
    origen: p.origen,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Publicaciones de Instagram y Facebook de Cauce — el agente genera, vos aprobás.
        </p>
      </div>

      <ConexionMeta
        config={config}
        metaOk={sp.meta_ok === "1"}
        metaError={sp.meta_error ?? null}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Borradores" value={String(stats.borradores)} />
        <Stat label="Programados" value={String(stats.programados)} />
        <Stat label="Publicados" value={String(stats.publicados)} />
        <Stat label="Con error" value={String(stats.conError)} />
      </div>

      <FeedMarketing posts={postViews} conectado={config.connected} />
    </div>
  );
}
