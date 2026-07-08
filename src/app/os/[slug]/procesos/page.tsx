import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { Badge, Card, EmptyState } from "@/components/ui";
import { fmtDateShort, fmtTime } from "../_lib/dates";
import { isOsOwner, resolveOsRole } from "../_components/os-role";
import { ProcesoToggle } from "../_components/proceso-toggle";

/**
 * Procesos — la lista simple de cómo está armado el negocio:
 * qué corre solo, cuándo y qué resuelve. Sin tecnicismos.
 */
export default async function ProcesosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  const owner = isOsOwner(osRole);

  const procesos = await db.proceso.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });

  const activos = procesos.filter((p) => p.estado === "ACTIVO").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tus procesos</h1>
        <p className="text-sm text-muted-foreground">
          Esto es lo que tu sistema hace solo, todos los días.
          {procesos.length > 0 ? ` ${activos} de ${procesos.length} funcionando.` : ""}
        </p>
      </div>

      {procesos.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="Todavía no hay procesos cargados"
          detail="Cauce está armando los tuyos. Apenas estén corriendo los ves acá, explicados en criollo."
        />
      ) : (
        <ul className="space-y-3">
          {procesos.map((p) => {
            const activo = p.estado === "ACTIVO";
            return (
              <li key={p.id}>
                <Card className="flex items-start gap-4 p-4">
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      activo ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{p.nombre}</h2>
                      <Badge variant={activo ? "success" : "default"}>
                        {activo ? "Funcionando" : "Pausado"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.queHace}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Corre:</span> {p.cuando}
                      {p.ultimaCorrida
                        ? ` · Última vez: ${fmtDateShort(p.ultimaCorrida)} ${fmtTime(p.ultimaCorrida)} h`
                        : ""}
                    </p>
                  </div>
                  {owner ? (
                    <ProcesoToggle slug={tenant.slug} procesoId={p.id} activo={activo} />
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          ¿Querés que algo funcione distinto o sumar un proceso nuevo? Escribinos y lo
          ajustamos:{" "}
          <a
            href="https://wa.me/5492915729501?text=Hola%20Cauce%2C%20quiero%20ajustar%20un%20proceso%20de%20mi%20sistema"
            className="font-medium text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            hablar con Cauce →
          </a>
        </p>
      </Card>
    </div>
  );
}
