import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { storageAvailable } from "@/lib/storage";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ListingForm, type ListingFormInitial } from "../_components/listing-form";

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "sitio")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.sitio} />;
  }

  const listing = await db.listing.findFirst({
    where: { id, clientId: tenant.id },
  });
  if (!listing) notFound();

  const initial: ListingFormInitial = {
    id: listing.id,
    title: listing.title,
    operation: listing.operation,
    propertyType: listing.propertyType,
    status: listing.status,
    priceUsd: listing.priceUsd,
    priceArs: listing.priceArs,
    expensesArs: listing.expensesArs,
    address: listing.address,
    neighborhood: listing.neighborhood,
    city: listing.city,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    areaM2: listing.areaM2,
    coveredM2: listing.coveredM2,
    description: listing.description,
    amenities: listing.amenities,
    photos: listing.photos,
    featured: listing.featured,
    active: listing.active,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Editar propiedad</h1>
        <p className="text-sm text-muted-foreground">{listing.title}</p>
      </div>
      <ListingForm slug={tenant.slug} listing={initial} storageOk={storageAvailable()} />
    </div>
  );
}
