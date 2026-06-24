import Link from "next/link";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:underline">
          ← Clientes
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Onboarding en 1 click</h1>
        <p className="text-sm text-muted-foreground">
          Completá los datos y armamos el cliente entero: marca, módulos del Cauce OS,
          blueprint, automatizaciones activas y acceso al portal.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
