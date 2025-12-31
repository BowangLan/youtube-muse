"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

interface ImageColors {
  dominant: string;
  vibrant: string;
}

export function useImageColors(imageUrl: string | undefined): ImageColors | null {
  const store = useMemo(() => {
    const valueRef = { current: null as ImageColors | null };
    const listeners = new Set<() => void>();

    return {
      getSnapshot: () => valueRef.current,
      set: (next: ImageColors | null) => {
        valueRef.current = next;
        listeners.forEach((listener) => listener());
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  }, []);

  const colors = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => null
  );

  useEffect(() => {
    if (!imageUrl) {
      store.set(null);
      return;
    }

    const extractColors = async () => {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Use smaller canvas for better performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Extract colors using color buckets
        const colorBuckets: { [key: string]: number } = {};
        let maxSaturation = 0;
        let mostVibrantColor = { r: 255, g: 255, b: 255 };

        for (let i = 0; i < pixels.length; i += 4 * 5) {
          // Sample every 5th pixel
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent or very dark pixels
          if (a < 128 || (r + g + b) / 3 < 30) continue;

          // Calculate HSL for saturation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2 / 255;
          const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)) / 255;

          // Track most vibrant color
          if (s > maxSaturation && l > 0.2 && l < 0.8) {
            maxSaturation = s;
            mostVibrantColor = { r, g, b };
          }

          // Bucket colors for dominant color
          const bucketKey = `${Math.floor(r / 32)},${Math.floor(g / 32)},${Math.floor(b / 32)}`;
          colorBuckets[bucketKey] = (colorBuckets[bucketKey] || 0) + 1;
        }

        // Find dominant color
        let maxCount = 0;
        let dominantBucket = "0,0,0";
        for (const [bucket, count] of Object.entries(colorBuckets)) {
          if (count > maxCount) {
            maxCount = count;
            dominantBucket = bucket;
          }
        }

        const [dr, dg, db] = dominantBucket.split(",").map((n) => parseInt(n) * 32 + 16);

        store.set({
          dominant: `rgb(${dr}, ${dg}, ${db})`,
          vibrant: `rgb(${mostVibrantColor.r}, ${mostVibrantColor.g}, ${mostVibrantColor.b})`,
        });
      } catch (error) {
        console.error("Error extracting colors:", error);
        store.set(null);
      }
    };

    extractColors();
  }, [imageUrl, store]);

  return colors;
}
