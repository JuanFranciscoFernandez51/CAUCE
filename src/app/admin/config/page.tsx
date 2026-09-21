import { getAjustes } from "@/lib/ajustes";
import { db } from "@/lib/db";
import { ConfigForm } from "./config-form";
import { EquipoPanel } from "./equipo-panel";
import { auth } from "@/lib/auth";
import { TablaUsuarios } from "../usuarios/tabla-usuarios";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

/**
 * Configuración de Cauce: los datos que salen en las propuestas, los valores
 * por defecto de los presupuestos y el equipo que entra al panel.
 */
export default async function ConfigPage() {
  const [ajustes, equipo, session, usuarios, clientes] = await Promise.all([
    getAjustes(),
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, username: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    auth(),
    db.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true, username: true, name: true, email: true, role: true, osRole: true, clientId: true, createdAt: true },
    }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
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

      <section id="usuarios" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Todos los que entran a cauceapp.com.ar: el equipo de Cauce y los usuarios de cada cliente. Tocá una fila para
            editarla. Las contraseñas no se pueden ver (se guardan cifradas); se pueden poner nuevas.
          </p>
        </div>
        <TablaUsuarios
          yo={session?.user?.username ?? ""}
          usuarios={usuarios.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          clientes={clientes}
        />
      </section>
    </div>
  );
}
