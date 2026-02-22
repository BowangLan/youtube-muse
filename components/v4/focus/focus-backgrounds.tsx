"use client";

import * as React from "react";

interface FocusBgProps {
  thumbnailUrl: string;
}

/**
 * 1. Radial Bloom
 * Heavy-blurred thumbnail with a radial vignette that draws the eye to the
 * center. The image bleeds through just enough to feel ambient — like the
 * track is "emitting" light into the room.
 */
export function FocusBgRadialBloom({ thumbnailUrl }: FocusBgProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(80px) brightness(0.55)",
          transform: "scale(1.15)",
        }}
      />
      {/* Radial vignette — bright center, dark edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </div>
  );
}

/**
 * 2. Dual Veil
 * Two blurred thumbnail layers at different blur radii and scales create a
 * sense of spatial depth — the sharper layer anchors the image, the softer
 * one bleeds colour into the periphery.
 */
export function FocusBgDualVeil({ thumbnailUrl }: FocusBgProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-5">
      {/* Near layer — less blur, grounded */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(40px) brightness(0.45)",
          transform: "scale(1.2)",
          opacity: 0.75,
        }}
      />
      {/* Far layer — extreme blur, floats up */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(130px) brightness(0.3)",
          transform: "scale(1.75) translateY(-8%)",
          opacity: 0.4,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/55 via-neutral-950/20 to-neutral-950/80" />
    </div>
  );
}

/**
 * 3. Warm Ember
 * The thumbnail is desaturated toward sepia and amplified for warmth, then
 * a low amber underglow rises from the bottom. Cozy and intimate — feels
 * like candlelight.
 */
export function FocusBgWarmEmber({ thumbnailUrl }: FocusBgProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(90px) saturate(1.8) sepia(0.45) brightness(0.5)",
          transform: "scale(1.2)",
        }}
      />
      {/* Amber underglow — rises from below the frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 115%, rgba(160, 70, 10, 0.55) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-950/45 via-neutral-900/55 to-neutral-950/90" />
    </div>
  );
}

/**
 * 4. Arctic Frost
 * The thumbnail is heavily desaturated and hue-rotated into cool slate-blue
 * territory. A thin shimmer of cold light sits near the top edge. Feels
 * clinical, focused, and wintry — like listening in an empty concert hall.
 */
export function FocusBgArcticFrost({ thumbnailUrl }: FocusBgProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(85px) saturate(0.2) hue-rotate(195deg) brightness(0.4)",
          transform: "scale(1.2)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/65 to-cyan-950/45" />
      {/* Subtle cold shimmer near top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 10%, rgba(148, 210, 255, 0.07) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * 5. Grain Film
 * SVG fractal-noise grain is overlaid on a blurred thumbnail at low opacity
 * and in "overlay" blend mode. The result feels analogue — like watching
 * music through the haze of a 16mm projector.
 */
export function FocusBgGrainFilm({ thumbnailUrl }: FocusBgProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${thumbnailUrl})`,
          filter: "blur(70px) brightness(0.45)",
          transform: "scale(1.15)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/65 via-neutral-950/25 to-neutral-950/80" />
      {/* Grain layer via SVG feTurbulence */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
        style={{ mixBlendMode: "overlay" }}
        aria-hidden="true"
      >
        <filter id="focus-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#focus-film-grain)" />
      </svg>
    </div>
  );
}
