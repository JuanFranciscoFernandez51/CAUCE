import { getAjustes } from "@/lib/ajustes";
import { db } from "@/lib/db";
import { ConfigForm } from "./config-form";
import { EquipoPanel } from "./equipo-panel";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

/**
 * Configuración de Cauce: los datos que salen en las propuestas, los valores
 * por defecto de los presupuestos y el equipo que entra al panel.
 */
export default async function ConfigPage() {
  const [ajustes, equipo] = await Promise.all([
    getAjustes(),
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, username: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Los datos de acá salen en las propuestas y en los documentos que mandás.
        </p>
      </div>

      <ConfigForm inicial={ajustes} />

      <EquipoPanel
        inicial={equipo.map((u) => ({
          ...u,
          createdAt: u.createdAt.toLocaleDateString("es-AR"),
        }))}
      />
    </div>
  );
}
