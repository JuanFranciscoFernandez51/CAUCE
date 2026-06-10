import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  assertTenantAccess,
  getTenantBySlug,
  tenantBranding,
  tenantModules,
  MODULE_LABELS,
  OS_MODULES,
  type OsModule,
} from "@/lib/tenant";
import { ThemeToggle } from "@/components/theme";

/** Módulos con UI lista en esta versión de Cauce OS. */
const READY_MODULES: OsModule[] = ["crm", "turnos"];

export default async function OsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const branding = tenantBranding(tenant);
  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 16%, transparent)`,
    "--accent": branding.accent,
    "--ring": branding.primary,
  } as React.CSSProperties;

  // El middleware ya exige sesión en /os; acá validamos pertenencia al tenant.
  const session = await auth();
  let forbidden = !session;
  if (session) {
    try {
      assertTenantAccess({
        role: session.user.role,
        userClientId: session.user.clientId,
        tenantId: tenant.id,
      });
    } catch {
      forbidden = true;
    }
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">No tenés acceso a este sistema</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu usuario no pertenece a {branding.displayName}. Si creés que es un
          error, hablá con Cauce.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary underline">
          Volver al login
        </Link>
      </div>
    );
  }

  const active = tenantModules(tenant);
  const base = `/os/${tenant.slug}`;

  return (
    <div style={themeVars} className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href={base} className="flex min-w-0 items-center gap-2.5">
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
            <span className="truncate text-base font-semibold">{branding.displayName}</span>
          </Link>

          <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:pb-0">
            <NavLink href={base} label="Inicio" />
            {OS_MODULES.filter((m) => active.includes(m)).map((m) =>
              READY_MODULES.includes(m) ? (
                <NavLink key={m} href={`${base}/${m}`} label={MODULE_LABELS[m]} />
              ) : (
                <span
                  key={m}
                  title="Próximamente"
                  className="cursor-not-allowed whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground opacity-60"
                >
                  {MODULE_LABELS[m]}
                  <span className="ml-1 text-[10px] uppercase">pronto</span>
                </span>
              )
            )}
          </nav>

          <div className="ml-auto sm:ml-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t py-4">
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

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {label}
    </Link>
  );
}
