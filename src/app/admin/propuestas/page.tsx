import { db } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { fmtDate, PACK_LABELS } from "../_components/format";

export const metadata = { title: "Propuestas" };
export const dynamic = "force-dynamic";

const ESTADOS: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "destructive" }> = {
  ENVIADA: { label: "Enviada", variant: "default" },
  VISTA: { label: "Vista 👀", variant: "warning" },
  ACEPTADA: { label: "Aceptada 🤝", variant: "success" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
};

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;

/** Seguimiento comercial: qué propuesta se abrió, cuál quedó fría, cuál cerró. */
export default async function PropuestasPage() {
  const propuestas = await db.propuesta.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Propuestas</h1>
        <p className="text-sm text-muted-foreground">
          Los links que mandaste y qué pasó con cada uno. Se generan desde Presupuestos.
        </p>
      </div>

      {propuestas.length === 0 ? (
        <EmptyState
          icon="📨"
          title="Sin propuestas todavía"
          detail="Armá una en Presupuestos y tocá «Generar link de propuesta»."
        />
      ) : (
        <ul className="space-y-2">
          {propuestas.map((p) => {
            const e = ESTADOS[p.estado] ?? ESTADOS.ENVIADA;
            return (
              <li key={p.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.negocio}</p>
                    <p className="text-sm text-muted-foreground">
                      {PACK_LABELS[p.pack] ?? p.pack} · {fmtUsd(p.setupUsd)} + {fmtUsd(p.monthlyUsd)}/mes
                      {p.contactoNombre ? ` · ${p.contactoNombre}` : ""}
                    </p>
                    <a
                      href={`/p/${p.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      /p/{p.token.slice(0, 10)}… →
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-xs text-muted-foreground">
                      <p>Enviada {fmtDate(p.createdAt)}</p>
                      {p.vistaAt ? <p>Vista {fmtDate(p.vistaAt)}</p> : null}
                    </div>
                    <Badge variant={e.variant}>{e.label}</Badge>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
