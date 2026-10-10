import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-volt text-white hover:bg-volt-dim shadow-[0_8px_20px_-6px_rgba(255,71,87,0.5)] hover:shadow-[0_12px_28px_-6px_rgba(255,71,87,0.6)]",
  secondary: "bg-whistle text-white hover:bg-whistle-dim shadow-[0_8px_20px_-6px_rgba(255,176,32,0.45)] hover:shadow-[0_12px_28px_-6px_rgba(255,176,32,0.55)]",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  outline: "bg-transparent border border-court-line text-ink hover:border-volt/60 hover:text-volt hover:bg-volt-soft/60",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const sheenable = ["primary", "secondary"];

function Sheen() {
  return (
    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/25 transition-transform duration-700 ease-out group-hover:translate-x-full" />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`focus-ring group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-wide transition-all duration-300 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {sheenable.includes(variant) && <Sheen />}
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: BaseProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`focus-ring group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-wide transition-all duration-300 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {sheenable.includes(variant) && <Sheen />}
      <span className="relative flex items-center gap-2">{children}</span>
    </Link>
  );
}
