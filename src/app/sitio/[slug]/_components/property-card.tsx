import Link from "next/link";
import Image from "next/image";
import {
  opLabel,
  typeLabel,
  fmtListingPrice,
} from "@/app/os/[slug]/_lib/listings";

export type PublicListing = {
  id: string;
  title: string;
  operation: string;
  propertyType: string;
  priceUsd: number | null;
  priceArs: number | null;
  neighborhood: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  photos: string[];
};

export function PropertyCard({ slug, listing }: { slug: string; listing: PublicListing }) {
  const photo = listing.photos[0] ?? null;
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(", ");
  const specs: string[] = [];
  if (listing.bedrooms != null) specs.push(`${listing.bedrooms} amb`);
  if (listing.bathrooms != null) specs.push(`${listing.bathrooms} baño${listing.bathrooms === 1 ? "" : "s"}`);
  if (listing.areaM2 != null) specs.push(`${listing.areaM2} m²`);

  return (
    <Link
      href={`/sitio/${slug}/propiedad/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
            🏠
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          {opLabel(listing.operation)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-lg font-semibold tabular-nums text-primary">
          {fmtListingPrice({ priceUsd: listing.priceUsd, priceArs: listing.priceArs })}
        </p>
        <h3 className="line-clamp-2 font-medium leading-snug">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">
          {typeLabel(listing.propertyType)}
          {place ? ` · ${place}` : ""}
        </p>
        {specs.length > 0 ? (
          <p className="mt-auto pt-1 text-sm text-muted-foreground">{specs.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}
