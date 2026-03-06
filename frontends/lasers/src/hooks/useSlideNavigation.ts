import { useState, useCallback } from 'react';

export interface UseSlideNavigationResult {
  readonly index: number;
  readonly total: number;
  goNext: () => void;
  goPrev: () => void;
  goTo: (i: number) => void;
}

/**
 * Encapsulates slide index state and navigation (S — single responsibility).
 * @param slideCount - Number of slides (must be >= 1).
 */
export function useSlideNavigation(slideCount: number): UseSlideNavigationResult {
  const total = Math.max(0, slideCount);
  const [index, setIndex] = useState(0);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goTo = useCallback(
    (i: number) => {
      if (total === 0) return;
      setIndex(Math.max(0, Math.min(i, total - 1)));
    },
    [total]
  );

  return { index, total, goNext, goPrev, goTo };
}
