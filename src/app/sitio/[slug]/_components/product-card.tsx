import Image from "next/image";
import { fmtProductPrice } from "../_lib/site-content";

export type PublicProduct = {
  id: string;
  name: string;
  priceUsd: number | null;
  priceArs: number | null;
  photo: string | null;
};

/**
 * Tarjeta de producto del catálogo público. Foto o placeholder, nombre y precio.
 * No es clickeable (todavía no hay detalle público de producto): muestra info.
 */
export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.photo ? (
          <Image
            src={product.photo}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
            🛍️
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <p className="mt-auto pt-1 text-base font-semibold tabular-nums text-primary">
          {fmtProductPrice({ priceUsd: product.priceUsd, priceArs: product.priceArs })}
        </p>
      </div>
    </div>
  );
}
