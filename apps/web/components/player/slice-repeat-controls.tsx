"use client";

import * as React from "react";
import { Repeat, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/player-store";
import { SliceRepeatProgressBar } from "./slice-repeat-progress-bar";

interface SliceRepeatControlsProps {
  className?: string;
}

export function SliceRepeatControls({ className }: SliceRepeatControlsProps) {
  const dispatch = usePlayerStore((state) => state.dispatch);
  const sliceRepeat = usePlayerStore((state) => state.sliceRepeat);
  const duration = usePlayerStore((state) => state.duration);
  const [startInput, setStartInput] = React.useState("");
  const [endInput, setEndInput] = React.useState("");
  const activeInputRef = React.useRef<"start" | "end" | null>(null);

  const handleClearSlice = () => {
    dispatch({ type: "UserClearSlice" });
  };

  const handleToggleAutoRepeat = () => {
    dispatch({
      type: "UserSetSliceAutoRepeat",
      autoRepeat: !sliceRepeat.autoRepeat,
    });
  };

  React.useEffect(() => {
    if (activeInputRef.current !== "start") {
      setStartInput(
        sliceRepeat.startTime !== null ? sliceRepeat.startTime.toFixed(1) : "",
      );
    }
    if (activeInputRef.current !== "end") {
      setEndInput(
        sliceRepeat.endTime !== null ? sliceRepeat.endTime.toFixed(1) : "",
      );
    }
  }, [sliceRepeat.startTime, sliceRepeat.endTime]);

  const commitStartInput = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      setStartInput(
        sliceRepeat.startTime !== null ? sliceRepeat.startTime.toFixed(1) : "",
      );
      return;
    }
    const normalized = Math.round(parsed * 10) / 10;
    dispatch({ type: "UserSetSliceStart", seconds: normalized });
    dispatch({ type: "UserSeek", seconds: normalized });
    setStartInput(normalized.toFixed(1));
  };

  const commitEndInput = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      setEndInput(
        sliceRepeat.endTime !== null ? sliceRepeat.endTime.toFixed(1) : "",
      );
      return;
    }
    const normalized = Math.round(parsed * 10) / 10;
    dispatch({ type: "UserSetSliceEnd", seconds: normalized });
    dispatch({ type: "UserSeek", seconds: normalized });
    setEndInput(normalized.toFixed(1));
  };

  const handleStartInputChange = (value: string) => {
    setStartInput(value);
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const normalized = Math.round(parsed * 10) / 10;
    dispatch({ type: "UserSetSliceStart", seconds: normalized });
    dispatch({ type: "UserSeek", seconds: normalized });
  };

  const handleEndInputChange = (value: string) => {
    setEndInput(value);
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const normalized = Math.round(parsed * 10) / 10;
    dispatch({ type: "UserSetSliceEnd", seconds: normalized });
    dispatch({ type: "UserSeek", seconds: normalized });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-white/10",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <Repeat className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Slice Repeat</h3>
            <p className="text-xs text-neutral-500">
              {sliceRepeat.isSliceSet
                ? sliceRepeat.autoRepeat
                  ? "Looping slice"
                  : "Playing slice once"
                : "Select a section to loop"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Manual time inputs */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
            <label className="flex items-center gap-2">
              <span>Start</span>
              <input
                inputMode="decimal"
                type="number"
                min={0}
                max={duration > 0 ? duration : undefined}
                step={0.1}
                value={startInput}
                onChange={(e) => handleStartInputChange(e.target.value)}
                onFocus={() => {
                  activeInputRef.current = "start";
                }}
                onBlur={(e) => {
                  activeInputRef.current = null;
                  commitStartInput(e.target.value);
                }}
                className="h-8 w-20 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-white outline-none ring-0 transition focus:border-orange-400/60"
                placeholder="0.0"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>End</span>
              <input
                inputMode="decimal"
                type="number"
                min={0}
                max={duration > 0 ? duration : undefined}
                step={0.1}
                value={endInput}
                onChange={(e) => handleEndInputChange(e.target.value)}
                onFocus={() => {
                  activeInputRef.current = "end";
                }}
                onBlur={(e) => {
                  activeInputRef.current = null;
                  commitEndInput(e.target.value);
                }}
                className="h-8 w-20 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-white outline-none ring-0 transition focus:border-red-400/60"
                placeholder={duration > 0 ? duration.toFixed(1) : "0.0"}
              />
            </label>
          </div>

          <div className="flex items-center gap-1">
            {/* Auto-repeat toggle */}
            <button
              onClick={handleToggleAutoRepeat}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                sliceRepeat.autoRepeat
                  ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10",
              )}
              title={
                sliceRepeat.autoRepeat ? "Auto-repeat: On" : "Auto-repeat: Off"
              }
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", sliceRepeat.autoRepeat)}
              />
              <span className="hidden sm:inline">
                {sliceRepeat.autoRepeat ? "Loop" : "Once"}
              </span>
            </button>

            {/* Clear button */}
            {sliceRepeat.isSliceSet && (
              <button
                onClick={handleClearSlice}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear slice"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slice progress bar */}
      <SliceRepeatProgressBar />
    </div>
  );
}

export function SliceRepeatToggleButton({ className }: { className?: string }) {
  const dispatch = usePlayerStore((state) => state.dispatch);
  const sliceRepeat = usePlayerStore((state) => state.sliceRepeat);

  return (
    <button
      onClick={() => dispatch({ type: "UserToggleSliceRepeatMode" })}
      className={cn(
        "flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-white/10 relative transition-colors cursor-pointer hover:scale-105 active:scale-95 select-none",
        sliceRepeat.isActive
          ? "text-orange-400"
          : "text-neutral-500 hover:text-white",
        className,
      )}
      title={sliceRepeat.isActive ? "Slice repeat: On" : "Slice repeat: Off"}
    >
      <div className="relative">
        <Repeat className="w-5 h-5" />
        {sliceRepeat.isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
        )}
      </div>
      <span className="hidden sm:inline-block text-xs sm:text-sm">
        {sliceRepeat.isActive ? "Slice" : "Repeat"}
      </span>
    </button>
  );
}
