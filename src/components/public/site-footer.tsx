import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-primary">Cauce</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            No vendemos horas. Vendemos procesos que se manejan solos.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <p className="text-sm font-semibold">Explorar</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/#como-funciona" className="hover:text-foreground">
                Cómo funciona
              </Link>
            </li>
            <li>
              <Link href="/precios" className="hover:text-foreground">
                Precios
              </Link>
            </li>
            <li>
              <Link href="/casos" className="hover:text-foreground">
                Casos
              </Link>
            </li>
            <li>
              <Link href="/consultoria" className="hover:text-foreground">
                Consultoría
              </Link>
            </li>
            <li>
              <Link href="/intake" className="hover:text-foreground">
                Pedir diagnóstico
              </Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Dónde estamos</p>
          <p className="mt-2">
            Bahía Blanca, Argentina — operamos remoto en todo el país.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Cauce</p>
        </div>
      </div>
    </footer>
  );
}
