export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, var(--fresh) 0%, var(--pink) 100%)",
          boxShadow: "0 6px 16px -6px oklch(0.62 0.24 356 / 0.5)",
        }}
        aria-hidden
      >
        <span style={{ fontSize: size * 0.55 }}>🍓</span>
      </div>
      <span
        className="font-display italic text-2xl leading-none"
        style={{ color: "var(--pink)" }}
      >
        Fruzi <span style={{ color: "var(--fresh)" }}>Bowl</span>
      </span>
    </div>
  );
}