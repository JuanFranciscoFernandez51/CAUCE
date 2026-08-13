import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { PresupuestoForm } from "./presupuesto-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo presupuesto" };

export default async function NuevoPresupuestoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const condiciones =
    (tenant.settings as { condicionesPresupuesto?: string } | null)?.condicionesPresupuesto ?? "";
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo presupuesto</h1>
        <p className="text-sm text-muted-foreground">Cargalo una vez: el PDF sale armado con tu marca.</p>
      </div>
      <PresupuestoForm slug={slug} condicionesBase={condiciones} />
    </div>
  );
}
