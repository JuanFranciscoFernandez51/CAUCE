import { db } from "@/lib/db";
import type { Client } from "@prisma/client";

/**
 * Núcleo multi-tenant de Cauce OS.
 * REGLA DE ORO: una sola codebase; personalización por configuración.
 * TODO query de módulos va scopeado por clientId (tenantId). Sin excepciones.
 */

export type TenantBranding = {
  logo?: string;
  primary?: string; // hex
  accent?: string;
  font?: string;
  displayName?: string;
};

export type CustomFieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
};

export type TenantCustomFields = {
  contact?: CustomFieldDef[];
  appointment?: CustomFieldDef[];
  product?: CustomFieldDef[];
};

export const OS_MODULES = ["crm", "turnos", "catalogo", "taller", "ventas", "eventos", "rrhh", "caja", "proyectos", "sitio"] as const;
export type OsModule = (typeof OS_MODULES)[number];

export const MODULE_LABELS: Record<OsModule, string> = {
  crm: "CRM",
  turnos: "Turnos & Agenda",
  catalogo: "Catálogo & Stock",
  taller: "Taller",
  ventas: "Ventas",
  eventos: "Eventos & Cronómetro",
  rrhh: "RRHH",
  caja: "Caja & Reportes",
  proyectos: "Proyectos",
  sitio: "Sitio web",
};

export async function getTenantBySlug(slug: string): Promise<Client | null> {
  return db.client.findUnique({ where: { slug } });
}

export function tenantBranding(client: Client): Required<TenantBranding> {
  const b = (client.branding as TenantBranding | null) ?? {};
  return {
    logo: b.logo ?? "",
    primary: b.primary ?? "#0f766e",
    accent: b.accent ?? "#f59e0b",
    font: b.font ?? "inherit",
    displayName: b.displayName ?? client.name,
  };
}

export function tenantModules(client: Client): OsModule[] {
  return (client.modules as OsModule[]).filter((m) => OS_MODULES.includes(m));
}

export function hasModule(client: Client, mod: OsModule): boolean {
  return tenantModules(client).includes(mod);
}

export function tenantCustomFields(client: Client): TenantCustomFields {
  return (client.customFields as TenantCustomFields | null) ?? {};
}

/** Verifica que el usuario logueado pertenezca a este tenant. */
export function assertTenantAccess(opts: {
  role: "ADMIN" | "CLIENT";
  userClientId: string | null;
  tenantId: string;
}): void {
  if (opts.role === "ADMIN") return; // Fran ve todo
  if (opts.userClientId !== opts.tenantId) throw new Error("FORBIDDEN_TENANT");
}
