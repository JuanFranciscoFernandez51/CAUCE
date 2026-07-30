"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { calcularDescuento, fmtPrecio, CUPON_POPUP } from "@/lib/bazar";
import { useCarrito } from "./carrito-store";
import { BZ } from "./bazar-shell";

/**
 * Carrito + checkout del bazar. Cupones NO acumulables (aplica el MAYOR entre
 * HOLA5 y el 10% de primera compra con cuenta, explicando cuál y por qué).
 * Si MercadoPago falla (gotcha 403 de Vercel), el pedido queda registrado
 * igual y se coordina el pago por WhatsApp.
 */

type Resultado = {
  numero: number;
  initPoint: string | null;
  total: number;
};

export function CarritoPage({
  slug,
  whatsapp,
  envioCosto,
  retornoPago,
  retornoPedido,
}: {
  slug: string;
  whatsapp: string | null;
  envioCosto: number;
  retornoPago: string | null; // "ok" | "pendiente" | "error" (vuelta de MP)
  retornoPedido: string | null;
}) {
  const base = `/sitio/${slug}`;
  const { items, setCant, quitar, vaciar, subtotal } = useCarrito();

  const [cupon, setCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState("");
  const [cuenta, setCuenta] = useState<{ nombre: string; usoDescuento: boolean } | null>(null);

  const [entrega, setEntrega] = useState<"retiro" | "envio">("retiro");
  const [datos, setDatos] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    cp: "",
    notas: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // ¿Está logueado con cuenta? (para el 10% de primera compra)
  useEffect(() => {
    fetch(`/api/public/sitio/${slug}/cuenta`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cuenta) {
          setCuenta({ nombre: d.cuenta.nombre, usoDescuento: d.cuenta.usoDescuento });
          setDatos((prev) => ({
            ...prev,
            nombre: prev.nombre || d.cuenta.nombre || "",
            email: prev.email || d.cuenta.email || "",
            telefono: prev.telefono || d.cuenta.telefono || "",
          }));
        }
      })
      .catch(() => null);
  }, [slug]);

  // Vuelta de MercadoPago: si el pago salió ok, vaciamos el carrito.
  useEffect(() => {
    if (retornoPago === "ok") vaciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retornoPago]);

  const cuentaConDescuento = Boolean(cuenta && !cuenta.usoDescuento);
  const envio = entrega === "envio" ? envioCosto : 0;
  const descuento = calcularDescuento({
    subtotal,
    cupon: cuponAplicado,
    cuentaConDescuento,
  });
  const total = subtotal - descuento.monto + envio;

  const cuponInvalido =
    cuponAplicado !== "" && cuponAplicado.toUpperCase() !== CUPON_POPUP;

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!datos.nombre.trim()) return setError("Decinos tu nombre");
    if (datos.telefono.trim().length < 6) return setError("Dejanos un teléfono válido");
    if (entrega === "envio" && !datos.direccion.trim())
      return setError("Necesitamos la dirección para el envío");
    setEnviando(true);
    try {
      const res = await fetch(`/api/public/sitio/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productoId: i.productoId, cant: i.cant })),
          cupon: cuponAplicado || null,
          retiroEnLocal: entrega === "retiro",
          ...datos,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No pudimos registrar el pedido");
      setResultado({ numero: data.numero, initPoint: data.initPoint ?? null, total: data.total });
      if (data.initPoint) {
        window.location.href = data.initPoint as string;
        return;
      }
      vaciar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#3FA9A5]";

  // ── Pantallas de resultado ──────────────────────────────────────────────

  if (retornoPago === "ok") {
    return (
      <Exito titulo={`¡Gracias por tu compra! 🐚`}>
        Tu pago del pedido {retornoPedido ? `#${retornoPedido}` : ""} fue aprobado. Te escribimos
        para coordinar la entrega.
        <VolverTienda base={base} />
      </Exito>
    );
  }
  if (retornoPago === "pendiente") {
    return (
      <Exito titulo="Tu pago está en proceso ⏳">
        Apenas se acredite, el pedido {retornoPedido ? `#${retornoPedido}` : ""} pasa a preparación.
        Cualquier cosa te escribimos.
        <VolverTienda base={base} />
      </Exito>
    );
  }
  if (resultado && !resultado.initPoint) {
    const waMsg = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
          `Hola! Hice el pedido #${resultado.numero} por ${fmtPrecio(resultado.total)} y quiero coordinar el pago.`
        )}`
      : null;
    return (
      <Exito titulo={`¡Pedido #${resultado.numero} registrado! ✅`}>
        Te escribimos por WhatsApp para coordinar el pago.
        {waMsg ? (
          <a
            href={waMsg}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-full py-3 text-center font-semibold text-white"
            style={{ backgroundColor: "#25D366" }}
          >
            💬 Escribinos ahora por WhatsApp
          </a>
        ) : null}
        <VolverTienda base={base} />
      </Exito>
    );
  }

  // ── Carrito vacío ───────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        {retornoPago === "error" ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            El pago no se pudo completar. Podés intentar de nuevo cuando quieras.
          </div>
        ) : null}
        <div className="text-5xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold" style={{ color: BZ.azul }}>
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Descubrí la tienda y llenalo de cosas lindas.
        </p>
        <Link
          href={`${base}/tienda`}
          className="mt-6 inline-block rounded-full px-7 py-3 font-semibold text-white"
          style={{ backgroundColor: BZ.aqua }}
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  // ── Carrito + checkout ──────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: BZ.azul }}>
        Tu carrito
      </h1>
      {retornoPago === "error" ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          El pago no se pudo completar. Revisá los datos e intentá de nuevo, o escribinos por
          WhatsApp.
        </div>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
        {/* Ítems */}
        <div>
          <ul className="divide-y" style={{ borderColor: "#EFF6F5" }}>
            {items.map((i) => (
              <li key={i.productoId} className="flex gap-4 py-4">
                {i.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.foto}
                    alt={i.nombre}
                    className="h-20 w-20 shrink-0 rounded-xl border object-cover"
                    style={{ borderColor: BZ.aquaClaro }}
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: BZ.arena }}
                  >
                    🐚
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.nombre}</p>
                  <p className="text-sm font-semibold" style={{ color: BZ.aqua }}>
                    {fmtPrecio(i.precio)} c/u
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCant(i.productoId, i.cant - 1)}
                      className="h-7 w-7 rounded-full border leading-none"
                      style={{ borderColor: BZ.aquaClaro }}
                      aria-label="Restar uno"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-medium">{i.cant}</span>
                    <button
                      type="button"
                      onClick={() => setCant(i.productoId, i.cant + 1)}
                      className="h-7 w-7 rounded-full border leading-none"
                      style={{ borderColor: BZ.aquaClaro }}
                      aria-label="Sumar uno"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => quitar(i.productoId)}
                      className="ml-3 text-xs text-gray-400 hover:text-red-500"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-bold" style={{ color: BZ.azul }}>
                  {fmtPrecio(i.precio * i.cant)}
                </p>
              </li>
            ))}
          </ul>

          {/* Cupón */}
          <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "#FBF9F4" }}>
            <label className="mb-1 block text-sm font-semibold" style={{ color: BZ.azul }}>
              ¿Tenés un cupón?
            </label>
            <div className="flex gap-2">
              <input
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                placeholder={`Ej: ${CUPON_POPUP}`}
                className={campo}
                style={{ borderColor: BZ.aquaClaro, backgroundColor: "#fff" }}
              />
              <button
                type="button"
                onClick={() => setCuponAplicado(cupon.trim())}
                className="shrink-0 rounded-xl px-4 text-sm font-semibold text-white"
                style={{ backgroundColor: BZ.azul }}
              >
                Aplicar
              </button>
            </div>
            {cuponInvalido ? (
              <p className="mt-2 text-xs text-red-500">
                Ese cupón no existe o ya no está vigente.
              </p>
            ) : null}
            {descuento.tipo ? (
              <p className="mt-2 text-xs font-medium" style={{ color: BZ.aqua }}>
                ✔ {descuento.motivo}
              </p>
            ) : null}
            {!cuenta ? (
              <p className="mt-2 text-xs text-gray-500">
                💡 Con una cuenta nueva tenés 10% OFF en tu primera compra —{" "}
                <Link href={`${base}/cuenta`} className="font-semibold underline">
                  crear cuenta
                </Link>
                . Los descuentos no se acumulan: siempre aplica el mayor.
              </p>
            ) : null}
          </div>
        </div>

        {/* Resumen + checkout */}
        <form
          onSubmit={confirmar}
          className="h-fit rounded-3xl border p-5"
          style={{ borderColor: BZ.aquaClaro }}
        >
          <h2 className="text-lg font-bold" style={{ color: BZ.azul }}>
            Entrega y pago
          </h2>

          <div className="mt-3 space-y-2">
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: entrega === "retiro" ? BZ.aqua : "#E8F2F1",
                backgroundColor: entrega === "retiro" ? "#F0FAF9" : "#fff",
              }}
            >
              <input
                type="radio"
                name="entrega"
                checked={entrega === "retiro"}
                onChange={() => setEntrega("retiro")}
              />
              🏬 Retiro por el local — <strong>gratis</strong>
            </label>
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: entrega === "envio" ? BZ.aqua : "#E8F2F1",
                backgroundColor: entrega === "envio" ? "#F0FAF9" : "#fff",
              }}
            >
              <input
                type="radio"
                name="entrega"
                checked={entrega === "envio"}
                onChange={() => setEntrega("envio")}
              />
              🚚 Envío a domicilio —{" "}
              <strong>{envioCosto > 0 ? fmtPrecio(envioCosto) : "a coordinar"}</strong>
            </label>
          </div>

          <div className="mt-4 space-y-2.5">
            <input
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              placeholder="Nombre y apellido *"
              required
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
            <input
              value={datos.telefono}
              onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
              placeholder="Teléfono / WhatsApp *"
              inputMode="tel"
              required
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
            <input
              value={datos.email}
              onChange={(e) => setDatos({ ...datos, email: e.target.value })}
              placeholder="Email"
              type="email"
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
            {entrega === "envio" ? (
              <>
                <input
                  value={datos.direccion}
                  onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
                  placeholder="Dirección (calle y número) *"
                  className={campo}
                  style={{ borderColor: BZ.aquaClaro }}
                />
                <div className="flex gap-2">
                  <input
                    value={datos.ciudad}
                    onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })}
                    placeholder="Ciudad"
                    className={campo}
                    style={{ borderColor: BZ.aquaClaro }}
                  />
                  <input
                    value={datos.cp}
                    onChange={(e) => setDatos({ ...datos, cp: e.target.value })}
                    placeholder="CP"
                    className={`${campo} w-24`}
                    style={{ borderColor: BZ.aquaClaro }}
                  />
                </div>
              </>
            ) : null}
            <textarea
              value={datos.notas}
              onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
              placeholder="Notas para tu pedido (opcional)"
              rows={2}
              className={campo}
              style={{ borderColor: BZ.aquaClaro }}
            />
          </div>

          <div className="mt-4 space-y-1.5 border-t pt-4 text-sm" style={{ borderColor: "#EFF6F5" }}>
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{fmtPrecio(subtotal)}</span>
            </div>
            {descuento.tipo ? (
              <div className="flex justify-between font-medium" style={{ color: BZ.aqua }}>
                <span>
                  Descuento {descuento.tipo === "CUENTA10" ? "10% primera compra" : `cupón ${CUPON_POPUP}`}
                </span>
                <span>−{fmtPrecio(descuento.monto)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-gray-500">Envío</span>
              <span>{entrega === "retiro" ? "Gratis" : envio > 0 ? fmtPrecio(envio) : "A coordinar"}</span>
            </div>
            <div
              className="flex justify-between border-t pt-2 text-lg font-extrabold"
              style={{ borderColor: "#EFF6F5", color: BZ.azul }}
            >
              <span>Total</span>
              <span>{fmtPrecio(total)}</span>
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={enviando}
            className="mt-4 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#009EE3" }}
          >
            {enviando ? "Procesando…" : "Pagar con Mercado Pago"}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            Si el pago online falla, el pedido queda registrado y lo coordinamos por WhatsApp.
          </p>
        </form>
      </div>
    </div>
  );
}

function Exito({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl">🐚✨</div>
      <h1 className="mt-4 text-2xl font-extrabold" style={{ color: BZ.azul }}>
        {titulo}
      </h1>
      <div className="mt-3 text-sm text-gray-600">{children}</div>
    </div>
  );
}

function VolverTienda({ base }: { base: string }) {
  return (
    <Link
      href={`${base}/tienda`}
      className="mt-6 inline-block rounded-full border-2 px-6 py-2.5 font-semibold"
      style={{ borderColor: BZ.aquaClaro, color: BZ.azul }}
    >
      Seguir comprando
    </Link>
  );
}
