"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

const links = [
  { href: "#modules", label: "Modules" },
  { href: "#sports", label: "Sports" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#stack", label: "Tech" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-court-line bg-court/85 shadow-nav backdrop-blur-lg"
          : "border-transparent bg-court/40 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt text-white transition-transform duration-300 ease-spring group-hover:rotate-[-8deg] group-hover:scale-110">
            <Zap size={18} strokeWidth={2.5} fill="currentColor" />
          </span>
          <span className="font-display text-xl tracking-wide">PLAYSPHERE</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-volt transition-all duration-300 ease-spring group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/register" variant="primary" size="sm">
            Join free
          </LinkButton>
        </div>

        <button
          className="focus-ring text-ink md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <div
        className={`overflow-hidden border-t border-court-line transition-[max-height,opacity] duration-300 md:hidden ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-ink-muted" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-3">
            <LinkButton href="/login" variant="outline" size="sm" className="flex-1">
              Log in
            </LinkButton>
            <LinkButton href="/register" variant="primary" size="sm" className="flex-1">
              Join free
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
