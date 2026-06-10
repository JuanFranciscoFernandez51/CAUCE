import { db } from "@/lib/db";
import { PipelineBoard, type BoardProject } from "./pipeline-board";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [projects, clients] = await Promise.all([
    db.project.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        lead: { select: { name: true, business: true } },
        client: { select: { name: true } },
      },
    }),
    db.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const boardProjects: BoardProject[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    level: p.level,
    setupFee: p.setupFee,
    who: p.client?.name ?? p.lead?.business ?? p.lead?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Arrastrá los proyectos entre etapas. Los cambios se guardan solos.
        </p>
      </div>
      <PipelineBoard initialProjects={boardProjects} clients={clients} />
    </div>
  );
}
