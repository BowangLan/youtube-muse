"use client";

import * as React from "react";
import {
  useKeyboardFeedbackStore,
  type KeyboardFeedbackIcon,
} from "@/lib/store/keyboard-feedback-store";
import { AnimatePresence, motion } from "motion/react";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "./icons";

const iconMap: Record<
  KeyboardFeedbackIcon,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  play: Icons.Play,
  pause: Icons.Pause,
  "skip-forward": Icons.SkipForward,
  "skip-back": Icons.SkipBack,
  next: Icons.SkipForward,
  previous: Icons.SkipBack,
  volume: Icons.Volume,
  mute: Icons.Mute,
  "seek-forward": Icons.SeekForward,
  "seek-backward": Icons.SeekBack,
};

export function KeyboardFeedback() {
  const currentFeedback = useKeyboardFeedbackStore(
    (state) => state.currentFeedback
  );
  const clearFeedback = useKeyboardFeedbackStore(
    (state) => state.clearFeedback
  );

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (currentFeedback) {
      timeoutRef.current = setTimeout(() => {
        clearFeedback();
        timeoutRef.current = null;
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentFeedback, clearFeedback]);

  const IconComponent = currentFeedback?.icon
    ? iconMap[currentFeedback.icon]
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        {currentFeedback && (
          <motion.div
            key={`${currentFeedback.icon}-${currentFeedback.label}`}
            initial={{ opacity: 0, scale: 0.8, y: 10, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.15, ease: EASING_EASE_OUT },
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: -10,
              filter: "blur(10px)",
              transition: { duration: 0.15, ease: EASING_EASE_OUT },
            }}
            className={`flex flex-col items-center gap-2 rounded-2xl px-6 py-4 backdrop-blur-xl shadow-2xl relative overflow-hidden ${
              currentFeedback.gradientClassName
                ? `before:pointer-events-none before:absolute before:inset-0 intent-card-active before:bg-linear-to-br before:opacity-90 ${currentFeedback.gradientClassName}`
                : "bg-black/50 border-white/10 border"
            }`}
          >
            {IconComponent && (
              <div className="text-foreground relative z-10">
                <IconComponent className="size-12" />
              </div>
            )}
            <span className="text-base font-normal text-foreground/80 relative z-10">
              {currentFeedback.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
