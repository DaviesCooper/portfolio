import { useEffect } from 'react';

export interface UseSlideKeyboardOptions {
  readonly goNext: () => void;
  readonly goPrev: () => void;
  readonly goTo: (index: number) => void;
  readonly total: number;
}

/**
 * Binds keyboard shortcuts for slide navigation (S — single responsibility).
 * Arrow right / Space: next; Arrow left: previous; Home/End: first/last.
 */
export function useSlideKeyboard({
  goNext,
  goPrev,
  goTo,
  total,
}: UseSlideKeyboardOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(total - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goTo, total]);
}
