"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook to check if component has mounted on the client.
 * Prevents hydration mismatches when using client-only state.
 */
export function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
