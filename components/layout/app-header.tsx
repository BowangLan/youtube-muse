export function AppHeader() {
  return (
    <div className="space-y-2 text-left">
      <p className="text-xs uppercase tracking-[0.4em] text-neutral-600">
        YouTube Music Player
      </p>
      <div className="flex items-end justify-between text-neutral-200">
        {/* Site name */}
        <h1 className="text-3xl font-light leading-none">YouTube Muse</h1>
        <span className="text-xs text-neutral-500">curate & play & focus</span>
      </div>
    </div>
  );
}
