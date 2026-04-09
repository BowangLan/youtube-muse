"use client";

import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface SearchIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SearchIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  /** When provided, controls animation state (e.g. from parent group-hover) */
  animate?: boolean;
}

const CIRCLE_PATH_LENGTH = 2 * Math.PI * 8;
const LINE_PATH_LENGTH = Math.sqrt(4.3 ** 2 + 4.3 ** 2);
const ANIMATION_DURATION = 400; // ms

const SearchIcon = forwardRef<SearchIconHandle, SearchIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, animate, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    useEffect(() => {
      if (animate !== undefined) {
        void controls.start(animate ? "animate" : "normal");
      }
    }, [animate, controls]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else if (animate === undefined) {
          controls.start("animate");
        }
      },
      [animate, controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else if (animate === undefined) {
          controls.start("normal");
        }
      },
      [animate, controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            cx="11"
            cy="11"
            r="8"
            initial="normal"
            strokeDasharray={CIRCLE_PATH_LENGTH}
            animate={controls}
            variants={{
              normal: { strokeDashoffset: 0 },
              animate: {
                strokeDashoffset: [CIRCLE_PATH_LENGTH, 0],
                transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
              },
            }}
            transition={{ duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.path
            d="m21 21-4.3-4.3"
            initial="normal"
            strokeDasharray={LINE_PATH_LENGTH}
            animate={controls}
            variants={{
              normal: { strokeDashoffset: 0 },
              animate: {
                strokeDashoffset: [LINE_PATH_LENGTH, 0],
                transition: { duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] },
              },
            }}
            transition={{ duration: ANIMATION_DURATION / 1000, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.svg>
      </div>
    );
  }
);

SearchIcon.displayName = "SearchIcon";

export { SearchIcon };
