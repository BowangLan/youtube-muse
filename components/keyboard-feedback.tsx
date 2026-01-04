"use client";

import * as React from "react";
import {
  useKeyboardFeedbackStore,
  type KeyboardFeedbackIcon,
} from "@/lib/store/keyboard-feedback-store";
import { AnimatePresence, motion } from "motion/react";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "./icons";

const iconMap: Record<KeyboardFeedbackIcon, React.ComponentType<any>> = {
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
      }, 500);
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
            className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/50 px-6 py-4 backdrop-blur-xl shadow-2xl"
          >
            {IconComponent && (
              <div className="text-foreground">
                <IconComponent className="size-5" />
              </div>
            )}
            <span className="text-lg font-normal text-foreground">
              {currentFeedback.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
