"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { MESES_ES } from "../../_lib/finanzas";

/** Selector de mes/año por querystring (?mes=1-12&anio=YYYY). */
export function PeriodoSelector({
  base,
  mes,
  anio,
  conMes = true,
}: {
  base: string; // "/os/slug/caja/mensual"
  mes?: number; // 0-11
  anio: number;
  conMes?: boolean;
}) {
  const router = useRouter();
  const ir = (m: number, y: number) => {
    const q = conMes ? `?mes=${m + 1}&anio=${y}` : `?anio=${y}`;
    router.push(`${base}${q}`);
  };
  return (
    <div className="flex items-center gap-2">
      {conMes ? (
        <Select
          className="h-9 w-auto"
          value={mes ?? 0}
          onChange={(e) => ir(Number(e.target.value), anio)}
        >
          {MESES_ES.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </Select>
      ) : null}
      <Select
        className="h-9 w-auto"
        value={anio}
        onChange={(e) => ir(mes ?? 0, Number(e.target.value))}
      >
        {[anio - 2, anio - 1, anio, anio + 1].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
