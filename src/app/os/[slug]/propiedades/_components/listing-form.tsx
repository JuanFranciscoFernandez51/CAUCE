"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  OPERATIONS,
  PROPERTY_TYPES,
  LISTING_STATUS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
} from "@/app/os/[slug]/_lib/listings";
import { PhotoUploader } from "./photo-uploader";

export type ListingFormInitial = {
  id: string;
  title: string;
  operation: string;
  propertyType: string;
  status: string;
  priceUsd: number | null;
  priceArs: number | null;
  expensesArs: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  coveredM2: number | null;
  description: string | null;
  amenities: string[];
  photos: string[];
  featured: boolean;
  active: boolean;
};

function numOrNull(raw: string): number | null | undefined {
  if (raw.trim() === "") return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined; // inválido
  return n;
}
function intOrNull(raw: string): number | null | undefined {
  if (raw.trim() === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

/** Alta y edición de propiedad. Si viene `listing`, hace PATCH; si no, POST. */
export function ListingForm({
  slug,
  listing,
  storageOk,
}: {
  slug: string;
  listing?: ListingFormInitial;
  storageOk: boolean;
}) {
  const router = useRouter();
  const s = (v: string | null | undefined) => v ?? "";
  const n = (v: number | null | undefined) => (v != null ? String(v) : "");

  const [title, setTitle] = useState(listing?.title ?? "");
  const [operation, setOperation] = useState(listing?.operation ?? "venta");
  const [propertyType, setPropertyType] = useState(listing?.propertyType ?? "departamento");
  const [status, setStatus] = useState(listing?.status ?? "disponible");
  const [priceUsd, setPriceUsd] = useState(n(listing?.priceUsd));
  const [priceArs, setPriceArs] = useState(n(listing?.priceArs));
  const [expensesArs, setExpensesArs] = useState(n(listing?.expensesArs));
  const [address, setAddress] = useState(s(listing?.address));
  const [neighborhood, setNeighborhood] = useState(s(listing?.neighborhood));
  const [city, setCity] = useState(s(listing?.city));
  const [bedrooms, setBedrooms] = useState(n(listing?.bedrooms));
  const [bathrooms, setBathrooms] = useState(n(listing?.bathrooms));
  const [areaM2, setAreaM2] = useState(n(listing?.areaM2));
  const [coveredM2, setCoveredM2] = useState(n(listing?.coveredM2));
  const [description, setDescription] = useState(s(listing?.description));
  const [amenitiesStr, setAmenitiesStr] = useState((listing?.amenities ?? []).join(", "));
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [featured, setFeatured] = useState(listing?.featured ?? false);
  const [active, setActive] = useState(listing?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("El título es obligatorio");

    const usd = numOrNull(priceUsd);
    const ars = numOrNull(priceArs);
    const exp = numOrNull(expensesArs);
    const a = numOrNull(areaM2);
    const ca = numOrNull(coveredM2);
    if ([usd, ars, exp, a, ca].some((v) => v === undefined)) {
      return setError("Revisá los precios y metros: tienen que ser números positivos");
    }
    const bed = intOrNull(bedrooms);
    const bath = intOrNull(bathrooms);
    if (bed === undefined || bath === undefined) {
      return setError("Ambientes y baños tienen que ser enteros positivos");
    }

    const amenities = amenitiesStr
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    setSaving(true);
    setError("");
    try {
      const url = listing
        ? `/api/os/${slug}/listings/${listing.id}`
        : `/api/os/${slug}/listings`;
      const res = await fetch(url, {
        method: listing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          operation,
          propertyType,
          status,
          priceUsd: usd,
          priceArs: ars,
          expensesArs: exp,
          address: address.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          bedrooms: bed,
          bathrooms: bath,
          areaM2: a,
          coveredM2: ca,
          description: description.trim() || null,
          amenities,
          photos,
          featured,
          active,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar la propiedad");
      router.push(`/os/${slug}/propiedades`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? <ErrorState message={error} /> : null}

        <Field label="Título *" help="Ej: Departamento 3 ambientes con balcón al frente">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Departamento 3 ambientes en Centro"
            required
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Operación">
            <Select value={operation} onChange={(e) => setOperation(e.target.value)}>
              {OPERATIONS.map((o) => (
                <option key={o} value={o}>
                  {OPERATION_LABELS[o]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {LISTING_STATUS.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Precio (USD)" help="Dejalo vacío si no aplica.">
            <Input
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="120000"
              inputMode="decimal"
            />
          </Field>
          <Field label="Precio (ARS)" help="Dejalo vacío si no aplica.">
            <Input
              value={priceArs}
              onChange={(e) => setPriceArs(e.target.value)}
              placeholder="350000"
              inputMode="decimal"
            />
          </Field>
          <Field label="Expensas (ARS/mes)" help="Opcional.">
            <Input
              value={expensesArs}
              onChange={(e) => setExpensesArs(e.target.value)}
              placeholder="80000"
              inputMode="decimal"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Dirección">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Colón 1234" />
          </Field>
          <Field label="Barrio">
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Centro" />
          </Field>
          <Field label="Ciudad">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bahía Blanca" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Ambientes">
            <Input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} inputMode="numeric" placeholder="3" />
          </Field>
          <Field label="Baños">
            <Input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} inputMode="numeric" placeholder="1" />
          </Field>
          <Field label="Superficie total (m²)">
            <Input value={areaM2} onChange={(e) => setAreaM2(e.target.value)} inputMode="decimal" placeholder="75" />
          </Field>
          <Field label="Superficie cubierta (m²)">
            <Input value={coveredM2} onChange={(e) => setCoveredM2(e.target.value)} inputMode="decimal" placeholder="68" />
          </Field>
        </div>

        <Field label="Amenities" help="Separados por coma. Ej: cochera, pileta, parrilla, balcón">
          <Input
            value={amenitiesStr}
            onChange={(e) => setAmenitiesStr(e.target.value)}
            placeholder="cochera, balcón, parrilla"
          />
        </Field>

        <Field label="Descripción">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contá lo que hace única a esta propiedad…"
            className="min-h-32"
          />
        </Field>

        <Field label="Fotos">
          <PhotoUploader
            slug={slug}
            listingId={listing?.id}
            photos={photos}
            onChange={setPhotos}
            storageOk={storageOk}
          />
        </Field>

        <div className="flex flex-wrap gap-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Destacada (aparece en la home del sitio)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Activa (visible en el sitio público)
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : null}
            {saving ? "Guardando…" : listing ? "Guardar cambios" : "Crear propiedad"}
          </Button>
          <ButtonLink href={`/os/${slug}/propiedades`} variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
