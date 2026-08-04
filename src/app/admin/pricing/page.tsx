import { redirect } from "next/navigation";

/** Presupuestos ahora vive dentro de Propuestas: armar y enviar es un solo flujo. */
export default function PricingPage() {
  redirect("/admin/propuestas");
}
