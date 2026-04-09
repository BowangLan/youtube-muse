"use client";

import { motion } from "motion/react";

export function PlayingIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      layoutId="playing-indicator"
    >
      <div className="flex items-end gap-[3px] h-4">
        <div
          className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        />
        <div
          className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-600"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        />
        <div
          className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-900"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
        />
      </div>
    </motion.div>
  );
}

export function PlayingIndicatorSmall({ isPlaying }: { isPlaying: boolean }) {
  return (
    <motion.div
      layoutId="playing-indicator"
      className="flex items-end gap-[3px] h-3 flex-none"
    >
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-600"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-900"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
    </motion.div>
  );
}
