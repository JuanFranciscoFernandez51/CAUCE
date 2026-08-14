import { redirect } from "next/navigation";

/** Pendientes vive ahora adentro del Calendario (agenda unificada). */
export default async function PendientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/os/${slug}/calendario#pendientes`);
}
