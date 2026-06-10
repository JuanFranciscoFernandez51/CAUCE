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
  const [client, automations, usage] = await Promise.all([
    db.client.findUniqueOrThrow({ where: { id: clientId } }),
    db.automation.findMany({ where: { clientId } }),
    db.usage.findUnique({ where: { clientId_period: { clientId, period: p } } }),
  ]);

  const [yearStr, monthStr] = p.split("-");
  const from = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1, 3)); // 00:00 ARG
  const to = new Date(Date.UTC(Number(monthStr) === 12 ? Number(yearStr) + 1 : Number(yearStr), Number(monthStr) % 12, 1, 3));

  const [leadsCaptured, appointments] = await Promise.all([
    db.contact.count({ where: { clientId, createdAt: { gte: from, lt: to } } }),
    db.appointment.count({ where: { clientId, createdAt: { gte: from, lt: to } } }),
  ]);

  const active = automations.filter((a) => a.status === "ACTIVE").length;
  const content: ReportContent = {
    period: p,
    automations: automations.map((a) => ({ name: a.name, status: a.status, health: a.health })),
    messages: usage?.messages ?? 0,
    leadsCaptured,
    appointments,
    summary: `En ${p}, ${client.name} tuvo ${active} automatización(es) activa(s), ${usage?.messages ?? 0} mensajes atendidos, ${leadsCaptured} contactos nuevos y ${appointments} turnos registrados.`,
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
