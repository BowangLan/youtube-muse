"use client";

import { useEffect, useState } from "react";

/**
 * Hook to check if component has mounted on the client.
 * Prevents hydration mismatches when using client-only state.
 */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
