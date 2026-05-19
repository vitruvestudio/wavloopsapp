export function Topbar() {
  return (
    <div className="border-b border-line bg-surface-1">
      <div className="mx-auto max-w-7xl px-s-4 py-s-2 sm:px-s-5 sm:py-[10px]">
        <p className="text-center text-[11px] leading-snug text-text-1 sm:text-caption">
          <span className="sm:hidden">
            Early access
            <span aria-hidden className="mx-s-2 text-text-3">·</span>
            $4.99/mo
            <span aria-hidden className="mx-s-2 text-text-3">·</span>
            Launches June 20
          </span>
          <span className="hidden sm:inline">
            Early Access
            <span aria-hidden className="mx-s-2 text-text-3">·</span>
            First 20 producers lock $4.99/mo instead of $19/mo
            <span aria-hidden className="mx-s-2 text-text-3">·</span>
            Launching June 20
          </span>
        </p>
      </div>
    </div>
  );
}
