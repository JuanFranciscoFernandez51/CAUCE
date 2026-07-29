import Link from "next/link";
import type { Client, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge, Stat } from "@/components/ui";
import {
  ClientesDoohTable,
  type ClienteDoohRow,
} from "../_components/dooh/clientes-dooh-table";

const fmt = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Carpeta de clientes del circuito de pantallas LED: TODOS los anunciantes del
 * tenant con buscador, edición inline y link a la ficha completa.
 */
export async function ListaClientesDooh({ tenant, q }: { tenant: Client; q: string }) {
  const base = `/os/${tenant.slug}`;

  const where: Prisma.ContactWhereInput = {
    clientId: tenant.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [contactos, total] = await Promise.all([
    db.contact.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: 500,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        pantallaContratos: {
          where: { estado: { not: "baja" } },
          select: { estado: true, montoMensual: true },
        },
      },
    }),
    db.contact.count({ where: { clientId: tenant.id } }),
  ]);

  const filas: ClienteDoohRow[] = contactos.map((c) => ({
    id: c.id,
    nombre: c.name,
    telefono: c.phone,
    email: c.email,
    pantallas: c.pantallaContratos.length,
    pausados: c.pantallaContratos.filter((k) => k.estado !== "activo").length,
    totalMensual: c.pantallaContratos
      .filter((k) => k.estado === "activo")
      .reduce((a, k) => a + k.montoMensual, 0),
  }));

  // Facturación del mes: siempre sobre TODOS los clientes, no sobre el filtro.
  const todos =
    q === ""
      ? filas
      : (
          await db.contact.findMany({
            where: { clientId: tenant.id },
            select: {
              pantallaContratos: {
                where: { estado: "activo" },
                select: { montoMensual: true },
              },
            },
          })
        ).map((c) => ({
          totalMensual: c.pantallaContratos.reduce((a, k) => a + k.montoMensual, 0),
          pantallas: c.pantallaContratos.length,
        }));
  const facturacionMensual = todos.reduce((a, c) => a + c.totalMensual, 0);
  const conPauta = todos.filter((c) => c.totalMensual > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Todos los anunciantes del circuito. Editá nombre, teléfono y email acá mismo, o entrá a
            la ficha para ver sus pantallas, lo que paga por mes, sus pagos y sus documentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`${base}/pantallas`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            🖥️ Pantallas
          </Link>
          <Link
            href={`${base}/crm`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            📇 Ver en el CRM
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Clientes" value={String(total)} />
        <Stat label="Facturación mensual" value={fmt(facturacionMensual)} hint="contratos activos" />
        <Stat
          label="Con pauta activa"
          value={String(conPauta)}
          hint={`${total - conPauta} sin pauta hoy`}
        />
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o email…"
          className="h-9 w-full max-w-sm rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted">
          Buscar
        </button>
        {q ? (
          <Link href={`${base}/clientes`} className="text-sm text-muted-foreground hover:underline">
            Limpiar
          </Link>
        ) : null}
        <span className="ml-auto">
          <Badge variant="default">
            {filas.length} en pantalla · {total} en total
          </Badge>
        </span>
      </form>

      <ClientesDoohTable slug={tenant.slug} clientes={filas} />
    </div>
  );
}
