"use client";

// Reads the chosen file and downscales it on an offscreen canvas so the
// resulting data URL stays reasonably small before it's stored directly
// wherever it's needed (no external image host / API key required).
export function readAndCompressImage(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported in this browser."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File, maxMB = 15): string | null {
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > maxMB * 1024 * 1024) return `That image is too large (max ${maxMB}MB).`;
  return null;
}
