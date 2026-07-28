/**
 * Íconos del template concesionaria — SVG propios, nada de emojis.
 * Los emojis delatan el "hecho con IA"; esto le da terminación de marca.
 */

type P = { className?: string; style?: React.CSSProperties };

export function IconWhatsapp({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.35c0-4.53 3.7-8.22 8.24-8.22 2.2 0 4.27.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.69 8.2-8.23 8.2Z" />
    </svg>
  );
}

export function IconInstagram({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M14 9h2.5V6H14c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.5l.5-3H13v-1.5c0-.8.2-1.5 1-1.5Z" />
    </svg>
  );
}

export function IconPin({ className = "h-4 w-4", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconReloj({ className = "h-4 w-4", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className = "h-4 w-4", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} style={style} aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMail({ className = "h-4 w-4", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7.5 8.5 6 8.5-6" strokeLinecap="round" />
    </svg>
  );
}

export function IconAuto({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden>
      <path d="M4 16v2.5M20 16v2.5" strokeLinecap="round" />
      <path d="M3 15.5v-3l1.8-4.2A2 2 0 0 1 6.6 7h10.8a2 2 0 0 1 1.8 1.3L21 12.5v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M3.4 12.5h17.2" strokeLinecap="round" />
      <circle cx="7.2" cy="14.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.8" cy="14.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconLlave({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 8 8M16 16l2-2M18.5 18.5 20 17" strokeLinecap="round" />
    </svg>
  );
}

export function IconBillete({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M5.5 9.5v5M18.5 9.5v5" strokeLinecap="round" />
    </svg>
  );
}

export function IconDoc({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M8.5 13h7M8.5 16.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconMedalla({ className = "h-5 w-5", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden>
      <circle cx="12" cy="14.5" r="5" />
      <path d="M9 9.5 7 3h10l-2 6.5M12 12.6l.9 1.8 2 .3-1.45 1.4.34 2-1.79-.94-1.79.94.34-2L9.1 14.7l2-.3.9-1.8Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconEstrella({ className = "h-4 w-4", style }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.73L6.8 19.6l1-5.8-4.2-4.1 5.8-.85L12 3.6Z" />
    </svg>
  );
}
