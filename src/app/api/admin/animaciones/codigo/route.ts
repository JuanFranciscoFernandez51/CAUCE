import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * Código fuente de una animación de la biblioteca + lo que se deduce de él:
 * dependencias a instalar y tabla de props (nombre, tipo, default, nota).
 * Solo admin: el código de React Bits no se publica en la web pública.
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const ruta = (new URL(req.url).searchParams.get("ruta") ?? "").split(" ")[0];
  if (!ruta.startsWith("src/components/animaciones/") || ruta.includes("..") || !/\.(tsx|ts)$/.test(ruta)) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }
  let codigo: string;
  try {
    codigo = await readFile(path.join(process.cwd(), ruta), "utf8");
  } catch {
    return NextResponse.json({ error: "No encontré el archivo" }, { status: 404 });
  }
  return NextResponse.json({ codigo, dependencias: dependencias(codigo), props: props(codigo) });
}

/** Paquetes externos que importa el componente (sin react). */
function dependencias(codigo: string): string[] {
  const out = new Set<string>();
  for (const m of codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const src = m[1];
    if (src.startsWith(".") || src.startsWith("@/") || src.startsWith("next")) continue;
    const pkg = src.startsWith("@") ? src.split("/").slice(0, 2).join("/") : src.split("/")[0];
    if (pkg === "react" || pkg === "react-dom") continue;
    out.add(pkg);
  }
  return [...out];
}

type Prop = { nombre: string; tipo: string; opcional: boolean; porDefecto: string | null; nota: string | null };

/** Props del componente: la interface *Props + los defaults del destructuring. */
function props(codigo: string): Prop[] {
  const inter = codigo.match(/(?:interface|type)\s+\w*Props\w*\s*=?\s*\{/);
  if (!inter || inter.index === undefined) return [];
  const cuerpo = bloque(codigo, inter.index + inter[0].length - 1);
  const lista: Prop[] = [];
  let nota: string | null = null;
  for (const linea of cuerpo.split("\n")) {
    const l = linea.trim();
    const com = l.match(/^\/\*\*?\s*(.*?)\s*\*\/$/) ?? l.match(/^\/\/\s*(.*)$/);
    if (com) {
      nota = com[1];
      continue;
    }
    const m = l.match(/^(\w+)(\?)?\s*:\s*(.+?);?$/);
    if (m) {
      lista.push({ nombre: m[1], tipo: m[3].replace(/;$/, ""), opcional: !!m[2], porDefecto: null, nota });
      nota = null;
    }
  }
  // Defaults: el primer "({ ... })" de la firma del componente.
  const firma = codigo.search(/(?:function\s+\w+\s*\(\s*\{|=\s*\(\s*\{)/);
  if (firma >= 0) {
    const ini = codigo.indexOf("{", firma);
    const params = bloque(codigo, ini);
    for (const m of params.matchAll(/(\w+)\s*=\s*([^,\n]+(?:\[[^\]]*\])?)/g)) {
      const p = lista.find((x) => x.nombre === m[1]);
      if (p) p.porDefecto = m[2].trim().replace(/,$/, "");
    }
  }
  return lista;
}

/** Texto entre la llave que abre en `desde` y su llave de cierre. */
function bloque(texto: string, desde: number): string {
  let nivel = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === "{") nivel++;
    else if (texto[i] === "}") {
      nivel--;
      if (nivel === 0) return texto.slice(desde + 1, i);
    }
  }
  return "";
}
