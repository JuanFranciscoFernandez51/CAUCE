import { MESES_CORTOS, abrevMonto } from "../../_lib/finanzas";
import { fmtArs } from "../money";

/**
 * Gráfico anual con barras CSS puras (sin dependencias): ingresos vs gastos
 * por mes + resultado como punto de color debajo. Server component.
 */
export function GraficoAnual({
  ingresos,
  gastos,
  resultado,
}: {
  ingresos: number[];
  gastos: number[];
  resultado: number[];
}) {
  const max = Math.max(...ingresos, ...gastos, 1);
  const conDatos = ingresos.some((v) => v > 0) || gastos.some((v) => v > 0);

  if (!conDatos) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos para graficar todavía.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-1 sm:gap-2" style={{ height: 180 }}>
        {MESES_CORTOS.map((mes, i) => {
          const hIng = Math.round((ingresos[i] / max) * 100);
          const hGas = Math.round((gastos[i] / max) * 100);
          return (
            <div key={mes} className="flex h-full flex-1 items-end justify-center gap-0.5">
              <div
                className="w-2.5 rounded-t bg-success/80 sm:w-3.5"
                style={{ height: `${hIng}%` }}
                title={`${mes}: ingresos ${fmtArs(ingresos[i])}`}
              />
              <div
                className="w-2.5 rounded-t bg-destructive/70 sm:w-3.5"
                style={{ height: `${hGas}%` }}
                title={`${mes}: gastos ${fmtArs(gastos[i])}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1 border-t pt-1 sm:gap-2">
        {MESES_CORTOS.map((mes, i) => (
          <div key={mes} className="flex-1 text-center">
            <div className="text-[10px] text-muted-foreground">{mes}</div>
            <div
              className={`text-[10px] font-semibold tabular-nums ${
                resultado[i] > 0
                  ? "text-success"
                  : resultado[i] < 0
                    ? "text-destructive"
                    : "text-muted-foreground/40"
              }`}
              title={`Resultado de ${mes}: ${fmtArs(resultado[i])}`}
            >
              {abrevMonto(resultado[i])}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success/80" /> Ingresos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/70" /> Gastos
        </span>
        <span>· El número de abajo es el resultado del mes.</span>
      </div>
    </div>
  );
}
