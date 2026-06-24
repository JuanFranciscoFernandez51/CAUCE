import { auth } from "@/lib/auth";
import { CambiarPassword } from "./cambiar-password";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Tu usuario es <span className="font-medium text-foreground">{session?.user?.name ?? "admin"}</span>.
          Cambiá tu contraseña cuando quieras.
        </p>
      </div>
      <CambiarPassword />
    </div>
  );
}
