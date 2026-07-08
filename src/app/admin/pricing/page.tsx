import { getPricing } from "@/lib/pricing";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";
import { PricingForm } from "./pricing-form";
import { PresupuestoBuilder } from "./presupuesto-builder";
import { PricingTabs } from "./pricing-tabs";

export const metadata = { title: "Presupuestos" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricing = await getPricing();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Presupuestos</h1>
        <p className="text-sm text-muted-foreground">
          Armá el número en vivo y copiá el texto listo para mandar. Los precios del sitio
          público salen de la pestaña de configuración.
        </p>
      </div>
      <PricingTabs
        armador={<PresupuestoBuilder pricing={pricing} procesos={PROCESOS_CATALOGO} />}
        config={<PricingForm initial={pricing} />}
      />
    </div>
  );
}
