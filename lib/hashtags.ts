/** Extracts unique, lowercased hashtags (without the #) from post content. */
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_]{2,30})/g) ?? [];
  const tags = matches.map((m) => m.slice(1).toLowerCase());
  return Array.from(new Set(tags)).slice(0, 10);
}
