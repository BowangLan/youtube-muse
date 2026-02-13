export function AppHeader() {
  return (
    <div className="space-y-1.5 text-left motion-opacity-in-0 motion-blur-in-lg motion-delay-500 sm:space-y-2 px-px-secondary">
      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-600 sm:text-xs sm:tracking-widest">
        Curate & Play & Focus
      </p>
      <div className="flex items-end justify-between text-neutral-200">
        {/* Site name */}
        <h1 className="text-2xl font-light leading-none md:text-3xl">
          YouTube Muse
        </h1>
        {/* <span className="text-xs text-neutral-500">curate & play & focus</span> */}
      </div>

      <div className="flex-1"></div>
    </div>
  );
}
