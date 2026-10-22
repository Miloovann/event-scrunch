import { Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";
import type { Approval } from "@/lib/domain";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#desk"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to the desk
      </a>
      <header className="border-b-4 border-teal bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">Community desk</p>
            <Link to="/" className="font-display text-3xl leading-none text-ink">
              EventScrunch
            </Link>
          </div>
          <p className="max-w-sm text-sm leading-snug text-muted">
            One line in. Run sheet, money, rota, poster and posts out. Nothing leaves until you approve it.
          </p>
        </div>
      </header>
      <main id="desk" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export function StatusMark({ approval }: { approval: Approval }) {
  const approved = approval === "approved";
  return (
    <span
      className={
        approved
          ? "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-teal-soft px-2.5 text-sm font-semibold text-teal"
          : "draft-stripe inline-flex min-h-8 items-center gap-1.5 rounded-full border border-dashed border-amber px-2.5 text-sm font-semibold text-amber"
      }
    >
      {approved ? <Check className="size-3.5" aria-hidden="true" /> : <Minus className="size-3.5" aria-hidden="true" />}
      {approved ? "Approved" : "Draft"}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

export const controlClass =
  "min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal text-ink";

export function PrimaryButton({
  children,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-on-teal disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}
