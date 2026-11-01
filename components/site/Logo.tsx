export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#1d5c45" />
      <path
        d="M20 44V20h13.5c5.8 0 9.5 3.3 9.5 8.3 0 3.6-1.9 6.2-5.1 7.4L44 44h-7.4l-5.4-7.6H26.6V44H20Zm6.6-13.2h6.5c2.3 0 3.6-1.1 3.6-3s-1.3-3-3.6-3h-6.5v6Z"
        fill="#f6f4ee"
      />
      <circle cx="47" cy="19" r="5" fill="#c9d94f" />
    </svg>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-xl font-bold tracking-tight ${inverted ? "text-white" : "text-ink"}`}>ReUse!</span>
    </span>
  );
}
