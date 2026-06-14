"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// Returns false during SSR and the first client render, true thereafter.
// Implemented with useSyncExternalStore so it needs no setState-in-effect
// (which the React 19 lint rules disallow). Used to gate wallet UI that would
// otherwise cause hydration mismatches.
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
