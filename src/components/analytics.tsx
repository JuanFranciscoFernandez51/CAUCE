/**
 * Analytics listo para enchufar — sin credenciales todavía.
 *
 * Cada componente se renderiza SOLO si su env existe. Mientras Fran no cargue
 * los IDs en Vercel, no inyectan nada y no rompen el build ni el runtime.
 * Cuando cargue las vars (NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID) y
 * redeploye, se activan solos. No hay que tocar código.
 *
 * Montados en src/app/layout.tsx (dentro del <body>).
 */
import Script from "next/script";

// ── Google Analytics (gtag) ──────────────────────────────
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}

// ── Meta Pixel (fbq) ─────────────────────────────────────
export function MetaPixel() {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!id) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

// ── Helper de eventos de conversión ──────────────────────
/**
 * Dispara un evento de conversión a GA y/o Meta si están cargados.
 * Seguro de llamar siempre: si no hay analytics, no hace nada.
 *
 * Ej: trackEvent("lead", { source: "casos" })
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  try {
    w.gtag?.("event", name, params ?? {});
  } catch {
    /* noop */
  }
  try {
    w.fbq?.("trackCustom", name, params ?? {});
  } catch {
    /* noop */
  }
}
