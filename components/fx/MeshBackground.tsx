// Ambient, fixed, full-viewport colour wash — sits behind every page (mounted
// once in the root layout) so the whole app reads as one connected, lively
// canvas instead of flat white behind isolated cards. Pure CSS, no JS.
export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-court" aria-hidden>
      <div className="absolute -top-[10%] -left-[15%] h-[55vw] w-[55vw] animate-float rounded-full bg-volt/25 blur-[130px]" />
      <div
        className="absolute top-[20%] -right-[15%] h-[50vw] w-[50vw] animate-floatSlow rounded-full bg-whistle/20 blur-[130px]"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-[-15%] left-[20%] h-[42vw] w-[42vw] animate-float rounded-full bg-spark/20 blur-[130px]"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] h-[30vw] w-[30vw] animate-floatSlow rounded-full bg-volt/10 blur-[110px]"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute inset-0 bg-grain opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-court" />
    </div>
  );
}
