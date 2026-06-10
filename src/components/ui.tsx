/**
 * Primitivas UI de Cauce — todas consumen los design tokens de globals.css.
 * Cuando llegue el brand definitivo, cambia globals.css y esto se re-tematiza solo.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Botones ──────────────────────────────────────────────
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";
const btnVariants = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "border bg-card text-card-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
} as const;
const btnSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-base",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof btnVariants;
  size?: keyof typeof btnSizes;
}) {
  return (
    <button
      className={cx(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof btnVariants;
  size?: keyof typeof btnSizes;
}) {
  return (
    <Link
      className={cx(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    />
  );
}

// ── Card ─────────────────────────────────────────────────
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
}

// ── Inputs ───────────────────────────────────────────────
const fieldBase =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldBase, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cx(fieldBase, "h-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cx("mb-1.5 block text-sm font-medium", className)} {...props} />
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {help ? <p className="mt-1 text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────
const badgeVariants = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  outline: "border text-foreground",
} as const;

export function Badge({
  variant = "default",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: keyof typeof badgeVariants }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

// ── Estados (vacío / error / cargando) ───────────────────
export function EmptyState({
  icon = "🌊",
  title,
  detail,
  action,
}: {
  icon?: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="font-medium">{title}</p>
      {detail ? <p className="max-w-md text-sm text-muted-foreground">{detail}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-label="Cargando"
    />
  );
}

// ── Stat (plantilla dorada de métricas) ──────────────────
export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const tones = {
    default: "",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  } as const;
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cx("mt-1 text-2xl font-semibold", tones[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

// ── Tabla simple ─────────────────────────────────────────
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={cx("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cx(
        "border-b bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cx("border-b px-3 py-2 align-middle", className)} {...props} />;
}
