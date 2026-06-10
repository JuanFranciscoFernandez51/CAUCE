import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ButtonLink, Card } from "@/components/ui";
import { PortalShell } from "./_components/shell";

export const metadata: Metadata = {
  title: "Portal del cliente — Cauce",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const clientId = session?.user.clientId ?? null;
  const client = clientId
    ? await db.client.findUnique({ where: { id: clientId }, select: { name: true } })
    : null;

  if (!client) {
    // ADMIN sin tenant (o cliente borrado): no hay portal que mostrar
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-2xl">👤</p>
          <h1 className="mt-2 text-lg font-semibold">Entrá como cliente</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu usuario no tiene un negocio asociado. El portal es para cuentas de
            cliente — si sos admin, gestioná todo desde el panel.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/" variant="secondary">
              Ir al inicio
            </ButtonLink>
            <ButtonLink href="/login">Cambiar de cuenta</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ¿Sos admin?{" "}
            <Link href="/admin" className="text-primary hover:underline">
              Ir al panel
            </Link>
          </p>
        </Card>
      </main>
    );
  }

  return <PortalShell clientName={client.name}>{children}</PortalShell>;
}
