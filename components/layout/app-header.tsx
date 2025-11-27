import { Music } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20">
      <div className="mx-auto w-full max-w-6xl px-6 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-5 py-4 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,60,151,0.22),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(23,37,84,0.26),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.18),transparent_36%)]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#0b3b8a] text-white shadow-lg shadow-blue-400/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-white/0 to-black/25" />
                <Music className="relative h-5 w-5 text-white/85" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  YouTube Muse
                </h1>
                <p className="text-xs text-white/60">
                  Curate and play YouTube-powered mixes
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/60 sm:flex">
              {/* <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.3em]">
                YouTube
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
