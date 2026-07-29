"use client";

import { useEffect, useLayoutEffect } from "react";
import { EN } from "@/lib/traducciones";
import { useLang } from "@/components/public/site-controls";

/**
 * Pasa la web pública a inglés cuando la cookie `lang` es "en".
 * Recorre los nodos de texto y los cambia por su traducción, respetando los
 * espacios de alrededor. Corre antes de pintar, así no se ve el cambio.
 */
function traducir(raiz: Node) {
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const cambios: Array<[Text, string]> = [];
  while (w.nextNode()) {
    const nodo = w.currentNode as Text;
    const padre = nodo.parentElement;
    if (!padre || padre.closest("script,style,svg,code,pre,[data-sin-traducir]")) continue;
    const bruto = nodo.textContent ?? "";
    const limpio = bruto.replace(/\s+/g, " ").trim();
    const en = EN[limpio];
    if (!en || en === limpio) continue;
    // conserva el espacio inicial y final del nodo original
    const antes = /^\s/.test(bruto) ? " " : "";
    const despues = /\s$/.test(bruto) ? " " : "";
    cambios.push([nodo, antes + en + despues]);
  }
  for (const [nodo, texto] of cambios) nodo.textContent = texto;
}

export function Traductor() {
  const lang = useLang();

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    if (lang !== "en") return;
    traducir(document.body);
  }, [lang]);

  // Contenido que aparece después (menú móvil, secciones que se revelan).
  useEffect(() => {
    if (lang !== "en") return;
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of Array.from(m.addedNodes)) {
          if (n.nodeType === 1 || n.nodeType === 3) traducir(n);
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [lang]);

  return null;
}
