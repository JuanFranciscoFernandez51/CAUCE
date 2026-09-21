import { PublicShell } from "@/components/public/shell";
import { DetalleAnimacion } from "@/components/animaciones/detalle";

export const metadata = { title: "Animación — Cauce" };

/** Ficha pública de una animación: demo grande, para qué sirve y el pedido por WhatsApp. */
export default async function AnimacionPublica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <DetalleAnimacion id={id} modo="publico" />
      </section>
    </PublicShell>
  );
}
