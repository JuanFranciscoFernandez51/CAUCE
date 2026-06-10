import { getPricing } from "@/lib/pricing";
import { PricingForm } from "./pricing-form";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricing = await getPricing();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Todo lo que ve el público sale de acá: nada está hardcodeado. Setup = pago único · Mensual = retainer.
        </p>
      </div>
      <PricingForm initial={pricing} />
    </div>
  );
}
