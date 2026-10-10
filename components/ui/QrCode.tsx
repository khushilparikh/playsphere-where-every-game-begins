"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Task 24, Phase 5: renders a QR code for a given string entirely
// client-side (the `qrcode` package does pure local encoding — no
// network call to any third-party QR-generation service).
export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: "svg", margin: 1, width: size })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!svg) {
    return <div className="flex items-center justify-center rounded-lg bg-court" style={{ width: size, height: size }} />;
  }

  return <div className="overflow-hidden rounded-lg bg-white p-2" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
