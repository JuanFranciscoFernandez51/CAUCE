/** Isologo de Cauce (dirección "Corriente", del handoff de marca). */
export function CauceMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" className="fill-[#121A28]" />
      <path d="M11 16 C22 16 23 24 37 24" stroke="#2E6BFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 24 C22 24 23 24 37 24" stroke="#5E8CFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M11 32 C22 32 23 24 37 24" stroke="#9DB6FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="37" cy="24" r="4" fill="#7FE8FF" />
    </svg>
  );
}

/**
 * Líneas de corriente decorativas del hero (como el mockup del brand):
 * cauces que fluyen y convergen. Solo decorativo.
 */
export function CurrentLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 600"
      preserveAspectRatio="none"
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <path d="M-50 80 C 300 80, 500 250, 760 250 S 1200 250, 1490 250" stroke="#2E6BFF" strokeWidth="1.5" fill="none" opacity="0.22" />
      <path d="M-50 250 C 300 250, 500 250, 760 250 S 1200 250, 1490 250" stroke="#5E8CFF" strokeWidth="1.5" fill="none" opacity="0.16" />
      <path d="M-50 430 C 300 430, 500 260, 760 255 S 1200 255, 1490 255" stroke="#9DB6FF" strokeWidth="1.5" fill="none" opacity="0.14" />
      <path d="M-50 560 C 350 560, 560 270, 820 262 S 1250 260, 1490 260" stroke="#7FE8FF" strokeWidth="1" fill="none" opacity="0.10" />
    </svg>
  );
}
