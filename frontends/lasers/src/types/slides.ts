import type { ReactNode } from 'react';

/** Supported laser machines; used to conditionally render tool-specific slide content. */
export type LaserTool = 'xtool' | 'trotec' | 'thunder';

/** Opaque id for a slide; use for keys and DOM id. */
export type SlideId = string;

/** Slide content: static node or function of selected laser tool for conditional content. */
export type SlideContent = ReactNode | ((tool: LaserTool) => ReactNode);

/** Data for a single slide. Presentation-agnostic (I — minimal interface). */
export interface SlideData {
  readonly id: SlideId;
  readonly title?: ReactNode;
  readonly subtitle?: ReactNode;
  readonly content: SlideContent;
  /** If set, slide is only included when this tool is selected. */
  readonly whenTool?: LaserTool;
}

/** Abstraction for a slide deck. Slideshow depends on this, not on concrete arrays (D). */
export interface SlideSource {
  readonly slides: ReadonlyArray<SlideData>;
  getSlideLabel(slide: SlideData, index: number): string;
}

/** Builds an accessible label for a slide (e.g. for aria-label). */
export function getSlideLabel(slide: SlideData): string {
  return getSlideAriaLabel(slide.id, slide.title, slide.subtitle);
}

/** Builds an aria-label string from id and optional title/subtitle (for use in Slide component). */
export function getSlideAriaLabel(
  id: string,
  title?: ReactNode,
  subtitle?: ReactNode
): string {
  if (typeof title === 'string') return title;
  if (subtitle != null && typeof subtitle === 'string') {
    return typeof title === 'string' ? `${subtitle} — ${title}` : `${subtitle} — ${id}`;
  }
  return id;
}
