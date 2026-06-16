import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { playbookForClient } from "@/lib/playbooks";
import { argDateStr, addDays, weekdayOf } from "@/app/os/[slug]/_lib/dates";
import { BookingFlow } from "./booking-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Agendar" };
  const b = tenantBranding(tenant);
  return {
    title: `Reservá tu turno — ${b.displayName}`,
    robots: { index: false, follow: false },
  };
}

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "turnos")) notFound();

  const branding = tenantBranding(tenant);
  const playbook = playbookForClient(tenant);
  const glossary = playbook.glossary;

  // Recursos (empleados activos) — sólo nombre, nada sensible.
  const employees = await db.employee.findMany({
    where: { clientId: tenant.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  // Días con disponibilidad configurada (weekday) — para no ofrecer días vacíos.
  const availability = await db.availability.findMany({
    where: { clientId: tenant.id },
    select: { weekday: true },
  });
  const weekdaysWithSlots = Array.from(new Set(availability.map((a) => a.weekday)));

  // Próximos ~14 días que caen en un weekday con disponibilidad.
  const today = argDateStr();
  const days: string[] = [];
  for (let i = 0; i < 14 && days.length < 14; i++) {
    const date = addDays(today, i);
    if (weekdaysWithSlots.includes(weekdayOf(date))) days.push(date);
  }

  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 16%, transparent)`,
    "--accent": branding.accent,
    "--ring": branding.primary,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/95">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 py-4">
          {branding.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo}
              alt={branding.displayName}
              className="h-9 w-9 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {branding.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{branding.displayName}</p>
            <p className="text-xs text-muted-foreground">Reservá tu {glossary.appointment} online</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <BookingFlow
          slug={tenant.slug}
          employees={employees}
          days={days}
          glossary={{
            appointment: glossary.appointment,
            appointmentCap:
              glossary.appointment.charAt(0).toUpperCase() + glossary.appointment.slice(1),
          }}
        />
      </main>

      <footer className="py-6">
        <p className="text-center text-xs text-muted-foreground">
          ⚡ Powered by{" "}
          <a href="https://cauce.app" className="font-medium hover:text-foreground">
            Cauce
          </a>
        </p>
      </footer>
    </div>
  );
}
