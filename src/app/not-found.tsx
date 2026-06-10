import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <p className="text-5xl">🌊</p>
      <h1 className="text-2xl font-bold">Esta página se fue río abajo</h1>
      <p className="max-w-md text-muted-foreground">
        No encontramos lo que buscás. Pero si lo que buscás es que tu negocio funcione solo, estás cerca.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Volver al inicio</ButtonLink>
        <ButtonLink href="/consultoria" variant="secondary">
          Agendar consultoría
        </ButtonLink>
      </div>
    </main>
  );
}
