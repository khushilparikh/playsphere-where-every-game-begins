"use client";

import { HTMLAttributes, ReactNode, useRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  /** Cursor-tracking radial spotlight highlight */
  glow?: boolean;
  /** Subtle 3D tilt that follows the cursor */
  tilt?: boolean;
  /** Dark scoreboard treatment (navy background, white text) used for
   * featured match/score cards, matching the app's live-scoring visual
   * language — pass this instead of manually setting bg-spark text-white. */
  dark?: boolean;
}

export function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  tilt = false,
  dark = false,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (glow) {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    }
    if (tilt) {
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-2px)`;
    }
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    if (tilt) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={glow || tilt ? handleMouseMove : undefined}
      onMouseLeave={tilt ? handleMouseLeave : undefined}
      className={`rounded-2xl border shadow-card ${
        dark
          ? "border-spark bg-spark text-white shadow-[0_8px_28px_-8px_rgba(27,31,59,0.55)]"
          : "border-court-line bg-court-surface"
      } ${glow ? "spotlight" : ""} ${
        hover
          ? `transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-card-hover ${dark ? "hover:border-whistle/40" : "hover:border-volt/30"}`
          : "transition-shadow duration-300"
      } ${tilt ? "transition-transform duration-200 ease-out [transform-style:preserve-3d]" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
