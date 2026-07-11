import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { NuevoEventoForm } from "./nuevo-evento-form";

/** Eventos del negocio: el activo es el que ve el público en /evento/<slug>. */
export default async function EventosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "eventos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.eventos} />;
  }

  const eventos = await db.evento.findMany({
    where: { clientId: tenant.id },
    include: { _count: { select: { competidores: true } } },
    orderBy: { fecha: "desc" },
    take: 30,
  });

  const base = `/os/${tenant.slug}/eventos`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Eventos & Cronómetro</h1>
        <p className="text-sm text-muted-foreground">
          Inscripción online, cronómetro con penalizaciones y ranking en vivo para proyectar.
        </p>
      </div>

      <NuevoEventoForm slug={tenant.slug} />

      {eventos.length === 0 ? (
        <EmptyState icon="⏱️" title="Sin eventos todavía" detail="Creá el primero acá arriba." />
      ) : (
        <ul className="space-y-2">
          {eventos.map((e) => {
            const [yyyy, mm, dd] = e.fecha.split("-");
            return (
              <li key={e.id}>
                <Link href={`${base}/${e.id}`} className="block">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                    <div>
                      <p className="font-semibold">{e.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {dd}/{mm}/{yyyy}
                        {e.lugar ? ` · ${e.lugar}` : ""} · {e._count.competidores}/{e.cupo} inscriptos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.activo ? <Badge variant="success">En la web</Badge> : null}
                      {e.inscripcionesAbiertas ? (
                        <Badge variant="primary">Inscripciones abiertas</Badge>
                      ) : (
                        <Badge>Cerradas</Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          La página pública del evento activo vive en{" "}
          <a
            href={`/evento/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            /evento/{tenant.slug} →
          </a>{" "}
          — compartila por WhatsApp o proyectala en pantalla.
        </p>
      </Card>
    </div>
  );
}
