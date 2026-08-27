import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios } from "@/lib/vidrios";
import { ImportadorStock } from "./importador";

export const dynamic = "force-dynamic";
export const metadata = { title: "Importar stock (PDF)" };

/** Importador de pedidos del proveedor: PDF adentro, stock sumado. */
export default async function ImportarStockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Importar stock desde PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subí el PDF del pedido de Malatesta: cada renglón suma su cantidad al stock. Los códigos nuevos se crean
          con precio en $0 para completar después desde{" "}
          <Link href={`/os/${slug}/productos`} className="underline underline-offset-2">Stock</Link>.
        </p>
      </div>
      <ImportadorStock slug={slug} />
    </div>
  );
}
