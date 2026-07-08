import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/usage";

export type ReportContent = {
  period: string;
  automations: { name: string; status: string; health: string }[];
  messages: number;
  leadsCaptured: number;
  appointments: number;
  summary: string;
};

/** Genera (o regenera) el reporte mensual de un cliente con datos reales. */
export async function generateMonthlyReport(clientId: string, period?: string): Promise<{ reportId: string }> {
  const p = period ?? currentPeriod();
  const [client, procesos, usage] = await Promise.all([
    db.client.findUniqueOrThrow({ where: { id: clientId } }),
    db.proceso.findMany({ where: { clientId }, orderBy: { orden: "asc" } }),
    db.usage.findUnique({ where: { clientId_period: { clientId, period: p } } }),
  ]);

  const [yearStr, monthStr] = p.split("-");
  const from = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1, 3)); // 00:00 ARG
  const to = new Date(Date.UTC(Number(monthStr) === 12 ? Number(yearStr) + 1 : Number(yearStr), Number(monthStr) % 12, 1, 3));

  const [leadsCaptured, appointments] = await Promise.all([
    db.contact.count({ where: { clientId, createdAt: { gte: from, lt: to } } }),
    db.appointment.count({ where: { clientId, createdAt: { gte: from, lt: to } } }),
  ]);

  const active = procesos.filter((a) => a.estado === "ACTIVO").length;
  const content: ReportContent = {
    period: p,
    // Se mantiene la clave "automations" para no romper reportes ya guardados.
    automations: procesos.map((a) => ({
      name: a.nombre,
      status: a.estado === "ACTIVO" ? "ACTIVE" : "PAUSED",
      health: a.estado === "ACTIVO" ? "OK" : "UNKNOWN",
    })),
    messages: usage?.messages ?? 0,
    leadsCaptured,
    appointments,
    summary: `En ${p}, ${client.name} tuvo ${active} proceso(s) funcionando, ${usage?.messages ?? 0} mensajes atendidos, ${leadsCaptured} contactos nuevos y ${appointments} turnos registrados.`,
  };

  const report = await db.report.upsert({
    where: { clientId_period: { clientId, period: p } },
    create: { clientId, period: p, content },
    update: { content },
  });

  // El costo variable estimado del cliente se actualiza con el uso real
  // → el dashboard muestra margen (MRR vs costo) de verdad.
  if (usage?.costUsd) {
    await db.client.update({
      where: { id: clientId },
      data: { costEstUsd: Math.round(usage.costUsd * 100) / 100 },
    });
  }
  return { reportId: report.id };
}
