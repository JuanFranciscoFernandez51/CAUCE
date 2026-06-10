import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPricing, fmtUsd } from "@/lib/pricing";
import type { RoadmapContent } from "@/lib/roadmap";
import { Badge, Card } from "@/components/ui";
import { ConsultActions } from "./consult-actions";

export const metadata = { title: "Consultoría" };
export const dynamic = "force-dynamic";

export default async function ConsultoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await db.consultNote.findUnique({
    where: { id },
    include: { lead: true, roadmap: true },
  });
  if (!note) notFound();
  const pricing = await getPricing();
  const roadmap = note.roadmap?.content as RoadmapContent | undefined;
  const project = await db.project.findFirst({ where: { leadId: note.leadId } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/consultorias" className="text-sm text-muted-foreground hover:underline">
            ← Consultorías
          </Link>
          <h1 className="text-xl font-semibold">{note.lead.business || note.lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            {note.lead.name}
            {note.lead.rubro ? ` · ${note.lead.rubro}` : ""}
            {note.lead.whatsapp ? ` · ${note.lead.whatsapp}` : ""}
            {note.lead.email ? ` · ${note.lead.email}` : ""}
          </p>
        </div>
        {pricing.roadmapPriceUsd > 0 ? (
          <Badge variant="primary">
            Roadmap: {fmtUsd(pricing.roadmapPriceUsd)}
            {pricing.roadmapCredit ? " (se acredita al setup)" : ""}
          </Badge>
        ) : (
          <Badge variant="success">Roadmap sin cargo</Badge>
        )}
      </div>

      <ConsultActions
        noteId={note.id}
        leadId={note.leadId}
        status={note.status}
        scheduledAt={note.scheduledAt?.toISOString() ?? null}
        callNotes={note.callNotes ?? ""}
        hasRoadmap={Boolean(note.roadmap)}
        hasProject={Boolean(project)}
      />

      {roadmap ? (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Resumen del roadmap</h2>
            <p className="text-sm leading-relaxed">{roadmap.resumen}</p>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {roadmap.fases.map((f, i) => (
              <Card key={i} className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{f.titulo}</h3>
                  <Badge variant="primary">{f.packSugerido}</Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{f.objetivo}</p>
                <ul className="space-y-2">
                  {f.items.map((it, j) => (
                    <li key={j} className="rounded-md bg-muted p-2.5 text-sm">
                      <span className="font-medium">{it.receta}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {it.area} · {it.nivel}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">{it.impacto}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm">
                  Setup <span className="font-semibold">{fmtUsd(f.precioEstimadoUsd.setup)}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  Mensual <span className="font-semibold">{fmtUsd(f.precioEstimadoUsd.mensual)}</span>
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
