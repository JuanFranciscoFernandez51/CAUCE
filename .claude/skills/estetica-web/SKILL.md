---
name: estetica-web
description: Al armar o retocar cualquier web pública de un tenant de Cauce — cargala SIEMPRE antes de entregar para que el sitio tenga movimiento, jerarquía y hovers vivos sin pisar la identidad de la marca.
---

# Estética web Cauce: movimiento y jerarquía sin pisar la marca

## Principio rector

**La marca del tenant manda.** Colores, tipografías, tono, logo y textos vienen del branding del tenant (config/plantilla) y esta skill NUNCA los cambia. Lo que suma esta skill es lo otro: movimiento, hovers, jerarquía, ritmo de scroll. Un sitio de Cauce jamás se entrega "plano" — pero tampoco se entrega disfrazado de otra marca. Si dudás entre un efecto copado y la identidad del cliente, gana la identidad.

Regla práctica: los efectos usan `currentColor`, variables del tenant (`var(--tpl)`, `var(--t-hero)`, etc.) o negro/blanco con opacidad. Nunca hardcodees un color nuevo para una animación.

## Checklist antes de entregar (repasalo entero)

1. **Todo elemento clickeable tiene hover con movimiento.** Nada responde solo con `cursor: pointer`. Imagen adentro de card: zoom suave con recorte. Botón: leve lift o cambio de opacidad. Link de texto: subrayado que crece.
   ```jsx
   <div className="group overflow-hidden rounded-2xl">
     <img className="transition-transform duration-300 group-hover:scale-105" ... />
   </div>
   ```

2. **El hero nunca es estático.** Mínimo una de estas: (a) ken burns sobre la foto, (b) crossfade de 3-4 fotos, (c) video muted en loop, (d) gradiente radial con color de marca sobre fondo oscuro (patrón Ave Fénix). El texto del hero entra con reveal.
   ```css
   @keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.08); } }
   .hero-foto { animation: kenburns 14s ease-in-out infinite alternate; }
   ```

3. **Reveals al entrar en viewport, en TODAS las secciones de la home.** Ya existe el componente: `src/app/sitio/[slug]/_components/conce/reveal.tsx` + clase `.conce-reveal` en `globals.css`. Reusalo (o copiá el patrón), no reinventes. Escaloná items hermanos con `delay={i * 90}`.
   ```jsx
   <Reveal delay={i * 90}><Card ... /></Reveal>
   ```

4. **Una cinta marquee si el negocio lo amerita** (promesas, marcas que trabaja, beneficios: "envíos a todo el país • 3 cuotas sin interés • ..."). Ya existen dos: `CintaPromesas` (bazar-shell.tsx, clase `.cinta-marquesina`) y `CintaBeneficios` (conce-home.tsx, `.conce-marquee`). Duplicá el contenido para el loop infinito y pausá en hover.

5. **Cards de catálogo/portfolio: overlay en hover que dice qué es** (patrón Echo Studio). Portada limpia; al hover aparece título + categoría con fade, y la foto zoomea.
   ```jsx
   <a className="group relative block overflow-hidden">
     <img className="transition-transform duration-300 group-hover:scale-105" ... />
     <div className="absolute inset-0 flex items-end bg-black/50 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
       <div className="text-white"><p className="font-bold">{titulo}</p><p className="text-sm opacity-80">{categoria}</p></div>
     </div>
   </a>
   ```

6. **Cards que se levantan.** Cards de sección/CTA suben unos px en hover, con sombra que crece (ya usado en conce-home).
   ```jsx
   className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
   ```

7. **Links de texto: subrayado que crece desde la izquierda**, no un `hover:underline` pelado (reservá ese para links secundarios chicos).
   ```css
   .link-vivo { background: linear-gradient(currentColor, currentColor) no-repeat left bottom / 0% 2px; transition: background-size .3s; }
   .link-vivo:hover { background-size: 100% 2px; }
   ```

8. **Jerarquía tipográfica extrema en el hero** (patrón Apple): un título GRANDE (`text-5xl md:text-7xl`, `leading-[0.95] tracking-tight`), un subtítulo corto, dos CTAs diferenciados (uno de acción "Comprar/Cotizar", uno informativo "Ver más"). Sin párrafos largos arriba del fold.

9. **Números que cuentan** cuando hay métricas reales (años, clientes, títulos, impactos). Contador que arranca al entrar en viewport, ~1.2s, sin librerías.
   ```jsx
   // dentro del callback del IntersectionObserver:
   const t0 = performance.now();
   const tick = (t) => { el.textContent = Math.round(fin * Math.min((t - t0) / 1200, 1)).toLocaleString("es-AR"); if (t - t0 < 1200) requestAnimationFrame(tick); };
   requestAnimationFrame(tick);
   ```

10. **Badges "en vivo" / estado con pulso** cuando hay algo pasando ahora (stock, pantallas al aire, local abierto): `animate-pulse` de Tailwind en un puntito, no en el texto.
    ```jsx
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> En vivo
    ```

11. **Fotos que rotan solas** en cards con varias fotos (productos, trabajos): crossfade cada 3-4s con CSS/estado, o swap de foto en hover si son solo 2 (`group-hover:opacity-0` sobre la primera, la segunda absoluta debajo).

12. **Alternancia de ritmo entre secciones**: variá fondo (claro/oscuro/tenue con tokens del tenant), variá layout (grilla → banda full-width → dos columnas). Nunca cinco secciones seguidas con la misma card sobre el mismo fondo.

13. **Botón primario con vida**: `transition` + `hover:opacity-90` mínimo; mejor `group-hover:scale-105` si vive dentro de una card, o lift propio. `active:scale-[0.98]` para el tap en mobile.

14. **Header sticky que reacciona**: sticky con borde/blur al scrollear (`sticky top-0 z-40 border-b backdrop-blur`), links de nav con hover claro (cambio de color u opacidad, transicionado).

15. **`prefers-reduced-motion` respetado en TODO lo que se mueve.** Cada keyframe/marquee/reveal nuevo lleva su `@media`. Los existentes ya lo hacen — mantené el estándar.
    ```css
    @media (prefers-reduced-motion: reduce) { .mi-anim { animation: none; transition: none; } }
    ```

## Qué rescatar de cada referencia

**Ave Fénix (avefenixleds.com.ar — dark, impacto):**
- Fondo casi negro + UN color de acento eléctrico; el acento se usa poco y por eso pega.
- Hero con gradiente radial del acento al 40% de opacidad sobre el fondo: profundidad sin foto.
- Badges de estado en vivo con puntito `animate-pulse` + dato real ("↗ 12.400 impactos hoy").
- Título gigante `leading-[0.95]` con UNA palabra en el color de acento e itálica.
- Nav uppercase, tracking abierto, chiquita: deja todo el protagonismo al contenido.

**Vespa/Aprilia (vespabahia.com.ar/aprilia — hero de marca, catálogo):**
- Hero que vende identidad, no producto: claim corto ("No es solo una moto. Es una declaración") + credenciales de marca ("54 títulos mundiales").
- Catálogo numerado (01–09): el número ordena y decora a la vez.
- Card de producto completa: foto, nombre, precio, CTA "Ver ficha" + badge "★ Destacada" en los modelos clave.
- Doble CTA de conversión siempre a mano: "Consultar" y "Reservar test ride" por WhatsApp.
- Secciones con título + subtítulo explicativo ("Racing Heritage", "Lineup completo"): jerarquía editorial clara.

**Apple (apple.com — scroll cinematográfico):**
- Titulares masivos y minimalistas: producto + una frase ("Now supercharged by M5"). Contraste de tamaño = jerarquía.
- Patrón de card repetible: título grande, subtítulo corto, dos CTAs (informativo + transaccional), imagen protagonista.
- Secciones que alternan dark/light y llenan el viewport: el scroll se siente como capítulos.
- La imagen ES el contenido: enorme, centrada, sin decoración alrededor.
- Cero ruido: pocas palabras por sección, mucho aire.

**Echo Studio (echostudiod.myportfolio.com — portfolio):**
- Grilla de portadas 16:9 uniforme y prolija; la uniformidad hace que el conjunto se vea premium.
- Hover sobre portada = overlay con título + año + categoría en fade suave. Portada limpia hasta que la tocás.
- Cada trabajo tiene su página interna tipo book: fotos grandes apiladas, texto mínimo.
- Nav minimalista de 3 items; el trabajo habla solo.
- Transiciones suaves y cortas, sin efectos que compitan con las fotos.

## Qué NO hacer

- **Animaciones que marean**: nada de elementos girando permanentemente, bounces infinitos, ni más de una animación ambiente por viewport.
- **Parallax pesado en mobile**: si querés parallax, solo desktop y con `transform` barato; en mobile foto fija.
- **Autoplay con sonido: JAMÁS.** Video siempre `muted playsInline loop` y con `poster`.
- **Ignorar `prefers-reduced-motion`**: toda animación nueva lleva su `@media (prefers-reduced-motion: reduce)`. Sin excepciones.
- **Hovers lentos**: transiciones de hover entre 150 y 400ms. Más de 400ms se siente roto.
- **Librerías de animación pesadas** (GSAP, framer-motion, AOS, Lottie): todo lo de esta skill sale con CSS puro, clases Tailwind y un hook chico de IntersectionObserver.
- **Efectos con colores propios**: overlays y glows usan negro/blanco con opacidad o el color del tenant. No inventes paleta.
- **Layout shift por animación**: los reveals mueven `opacity`/`transform`, nunca `height`/`margin`. Reservá el espacio de las imágenes (aspect-ratio).
- **Marquee ilegible**: 25-35s por vuelta, pausado en hover. Si va más rápido no se lee.

## Snippets reusables (ya existen en el repo — apuntá a reusar)

**Reveal al scroll** — `src/app/sitio/[slug]/_components/conce/reveal.tsx` + `.conce-reveal` en `src/app/globals.css`. Importalo o copiá el par componente+CSS al template nuevo:

```jsx
// conce/reveal.tsx (resumen): IntersectionObserver threshold 0.12,
// agrega .is-visible una sola vez, respeta reduced-motion.
<Reveal delay={90}><SectionCard /></Reveal>
```
```css
.conce-reveal { opacity: 0; transform: translateY(24px);
  transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
  transition-delay: var(--reveal-delay, 0ms); }
.conce-reveal.is-visible { opacity: 1; transform: none; }
```

**Marquee / cinta** — `CintaPromesas` en `bazar/bazar-shell.tsx` (CSS `.cinta` + `.cinta-marquesina` + `@keyframes cinta` en globals.css) y `CintaBeneficios` en `conce/conce-home.tsx` (self-contained con `<style jsx>`). El truco: duplicar el contenido y trasladar -50%.

```jsx
<div className="overflow-hidden">
  <div className="conce-marquee flex w-max items-center gap-10 pr-10">
    {[...items, ...items].map((t, i) => <span key={i}>{t} •</span>)}
  </div>
</div>
```
```css
@keyframes conce-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.conce-marquee { animation: conce-marquee 32s linear infinite; }
.conce-marquee:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .conce-marquee { animation: none; } }
```
