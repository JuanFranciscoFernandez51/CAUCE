"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BazarItem } from "@/lib/bazar";

/**
 * Carrito del bazar: estado global client-side persistido en localStorage
 * (clave por tenant). El server SIEMPRE revalida precios y stock al hacer
 * checkout — esto es solo UX.
 */

type CarritoCtx = {
  items: BazarItem[];
  agregar: (item: Omit<BazarItem, "cant">, cant?: number) => void;
  setCant: (productoId: string, cant: number) => void;
  quitar: (productoId: string) => void;
  vaciar: () => void;
  cantidadTotal: number;
  subtotal: number;
  drawerAbierto: boolean;
  setDrawerAbierto: (v: boolean) => void;
};

const Ctx = createContext<CarritoCtx | null>(null);

export function useCarrito(): CarritoCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito fuera de CarritoProvider");
  return ctx;
}

export function CarritoProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const KEY = `bz-carrito-${slug}`;
  const [items, setItems] = useState<BazarItem[]>([]);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);

  // Hidratación del carrito desde localStorage: tiene que ser en un effect
  // (el server no conoce el storage y el primer render debe coincidir).
  useEffect(() => {
    let vivo = true;
    queueMicrotask(() => {
      if (!vivo) return;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as BazarItem[];
          if (Array.isArray(parsed)) {
            setItems(parsed.filter((i) => i && i.productoId && i.cant > 0));
          }
        }
      } catch {
        // localStorage roto: arrancamos vacío
      }
      setCargado(true);
    });
    return () => {
      vivo = false;
    };
  }, [KEY]);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // sin espacio: seguimos en memoria
    }
  }, [KEY, items, cargado]);

  const agregar = useCallback((item: Omit<BazarItem, "cant">, cant = 1) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.productoId === item.productoId);
      if (existe) {
        return prev.map((i) =>
          i.productoId === item.productoId ? { ...i, cant: Math.min(99, i.cant + cant) } : i
        );
      }
      return [...prev, { ...item, cant: Math.min(99, Math.max(1, cant)) }];
    });
    setDrawerAbierto(true);
  }, []);

  const setCant = useCallback((productoId: string, cant: number) => {
    setItems((prev) =>
      cant <= 0
        ? prev.filter((i) => i.productoId !== productoId)
        : prev.map((i) => (i.productoId === productoId ? { ...i, cant: Math.min(99, cant) } : i))
    );
  }, []);

  const quitar = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const value = useMemo<CarritoCtx>(
    () => ({
      items,
      agregar,
      setCant,
      quitar,
      vaciar,
      cantidadTotal: items.reduce((s, i) => s + i.cant, 0),
      subtotal: items.reduce((s, i) => s + i.precio * i.cant, 0),
      drawerAbierto,
      setDrawerAbierto,
    }),
    [items, agregar, setCant, quitar, vaciar, drawerAbierto]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
