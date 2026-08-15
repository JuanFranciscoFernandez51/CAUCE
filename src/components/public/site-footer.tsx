import Link from "next/link";
import { CauceMark } from "@/components/public/cauce-mark";

export function SiteFooter() {
  return (
    <footer className="px-3 pb-4 pt-6 sm:px-4 sm:pb-6">
      <div className="menta-dark mx-auto max-w-6xl rounded-[32px] px-6 py-12 sm:rounded-[40px] sm:px-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <CauceMark className="h-9 w-9" />
              <div>
                <p className="font-display text-xl font-medium tracking-tight">Cauce</p>
                <p className="text-xs font-medium text-accent">Que tu negocio fluya</p>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              No vendemos horas. Vendemos procesos que se manejan solos.
            </p>
          </div>
          <nav aria-label="Pie de página">
            <p className="text-sm font-semibold">Explorar</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#como-funciona" className="transition-colors hover:text-foreground">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/precios" className="transition-colors hover:text-foreground">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/casos" className="transition-colors hover:text-foreground">
                  Casos
                </Link>
              </li>
              <li>
                <Link href="/consultoria" className="transition-colors hover:text-foreground">
                  Consultoría
                </Link>
              </li>
              <li>
                <Link href="/intake" className="transition-colors hover:text-foreground">
                  Pedir diagnóstico
                </Link>
              </li>
              <li>
                <Link href="/animaciones" className="transition-colors hover:text-foreground">
                  Animaciones
                </Link>
              </li>
            </ul>
          </nav>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Dónde estamos</p>
            <p className="mt-3">
              Bahía Blanca, Argentina — operamos remoto en todo el país.
            </p>
            <p className="mt-5">© {new Date().getFullYear()} Cauce</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
