import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getConceSite } from "../_lib/conce-site";
import { ConceShell } from "../_components/conce/conce-shell";
import { RC } from "@/lib/conce";
import { ConsultaConceForm } from "../_components/conce/consulta-conce-form";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Contacto" };
  return { title: `Contacto — ${site.info.nombre}`, robots: { index: false, follow: false } };
}

export default async function ContactoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;

  return (
    <ConceShell info={info}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contactanos</h1>
        <p className="mt-1 text-sm t-tenue">
          Escribinos y te respondemos a la brevedad. También podés visitarnos en cualquiera de
          nuestras sucursales.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {info.sucursales.map((s, i) => (
              <div
                key={i}
                className="rounded-3xl t-card p-6"
                style={{ border: `1px solid ${RC.borde}` }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.doradoTexto }}>
                  Sucursal {i + 1}
                </p>
                <p className="mt-1 text-lg font-bold">📍 {s.direccion}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.maps ? (
                    <a
                      href={s.maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                      style={{ borderColor: RC.borde }}
                    >
                      🗺️ Cómo llegar
                    </a>
                  ) : null}
                  {s.whatsapp ? (
                    <a
                      href={`https://wa.me/${s.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full px-4 py-2 text-sm font-bold text-white"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      💬 WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="rounded-3xl p-6" style={{ backgroundColor: RC.doradoSuave }}>
              {info.horarios ? (
                <p className="text-sm font-semibold t-tenue">🕒 {info.horarios}</p>
              ) : null}
              {info.email ? (
                <p className="mt-2 text-sm t-tenue">
                  ✉️{" "}
                  <a href={`mailto:${info.email}`} className="font-semibold hover:underline">
                    {info.email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <ConsultaConceForm slug={tenant.slug} />
          </div>
        </div>
      </div>
    </ConceShell>
  );
}
