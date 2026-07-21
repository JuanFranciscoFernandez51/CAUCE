import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { Importador } from "./importador";

export default async function ImportarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "crm")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.crm} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href={`/os/${tenant.slug}/crm`} className="text-sm text-muted-foreground hover:text-foreground">
          ← CRM
        </Link>
        <h1 className="text-2xl font-semibold">Importar contactos</h1>
        <p className="text-sm text-muted-foreground">
          Traé tu agenda de una: pegá desde Excel/Google Sheets o subí un CSV. Los repetidos
          no se duplican.
        </p>
      </div>
      <Importador slug={tenant.slug} />
    </div>
  );
}
