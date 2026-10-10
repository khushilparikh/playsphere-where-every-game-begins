export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-volt">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl tracking-wide text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-ink-muted">{description}</p>}
    </div>
  );
}
