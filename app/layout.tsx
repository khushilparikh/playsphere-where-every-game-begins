import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MeshBackground } from "@/components/fx/MeshBackground";
import { RoleProvider } from "@/components/providers/RoleProvider";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlaySphere — where every game begins",
  description:
    "Ahmedabad's full-stack sports community, venue booking, tournament management and live scoring platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body antialiased bg-court text-ink">
        <MeshBackground />
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
