import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ContactNewForm } from "../../_components/contact-new-form";

export default async function NuevoContactoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "crm")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.crm} />;
  }

  const customDefs = tenantCustomFields(tenant).contact ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo contacto</h1>
        <p className="text-sm text-muted-foreground">
          Se suma a tu pipeline en la etapa que elijas.
        </p>
      </div>
      <ContactNewForm slug={tenant.slug} customDefs={customDefs} />
    </div>
  );
}
