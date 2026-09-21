import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TablaUsuarios } from "./tabla-usuarios";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

/** Todos los usuarios de Cauce: el equipo (admins) y los de cada cliente. */
export default async function UsuariosPage() {
  const session = await auth();
  const [usuarios, clientes] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true, username: true, name: true, email: true, role: true, osRole: true, clientId: true, createdAt: true },
    }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos los que entran a cauceapp.com.ar: el equipo de Cauce y los usuarios de cada cliente. Tocá una fila para editarla.
          Las contraseñas no se pueden ver (se guardan cifradas); se pueden poner nuevas.
        </p>
      </div>
      <TablaUsuarios
        yo={session?.user?.username ?? ""}
        usuarios={usuarios.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        clientes={clientes}
      />
    </div>
  );
}
