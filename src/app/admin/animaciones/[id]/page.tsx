import { DetalleAnimacion } from "@/components/animaciones/detalle";

export const metadata = { title: "Animación" };

/** Ficha interna: demo grande + uso, props, dependencias y código fuente para copiar. */
export default async function AnimacionAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleAnimacion id={id} modo="admin" />;
}
