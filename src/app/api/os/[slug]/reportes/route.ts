import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../_guard";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";
import { generateMonthlyReport } from "@/lib/reports";
import { currentPeriod } from "@/lib/usage";

/**
 * Guard de reportes: sesión + tenant + SOLO dueño (no equipo).
 * Los reportes son una vista de negocio del dueño, no operativa.
 */
async function guardOwner(slug: string) {
  const guard = await guardOsApi(slug);
  if (guard.error) return guard;
  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, guard.tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return { error: NextResponse.json({ error: "Sin acceso a Reportes" }, { status: 403 }) } as const;
  }
  return guard;
}

/** GET → lista los reportes del tenant (más reciente primero). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  const reports = await db.report.findMany({
    where: { clientId: guard.tenant.id },
    orderBy: { period: "desc" },
    select: { id: true, period: true, content: true, sentAt: true, createdAt: true },
  });
  return NextResponse.json({ reports });
}

/** POST → genera/actualiza el reporte del período actual (hora ARG) del tenant. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOwner(slug);
  if (guard.error) return guard.error;

  try {
    const { reportId } = await generateMonthlyReport(guard.tenant.id, currentPeriod());
    return NextResponse.json({ ok: true, reportId, period: currentPeriod() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el reporte" }, { status: 500 });
  }
}
