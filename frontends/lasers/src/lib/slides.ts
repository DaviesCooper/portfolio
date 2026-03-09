import type { ReactNode } from 'react';

/** Supported laser machines; used to conditionally render tool-specific slide content. */
export type LaserTool = 'xtool' | 'trotec' | 'thunder';

/** Opaque id for a slide; use for keys and DOM id. */
export type SlideId = string;

/** Props passed to each slide component. */
export interface SlideComponentProps {
  readonly tool: LaserTool;
}

/** A slide is a component with attached metadata. The slides list is just an array of these. */
export type SlideComponent = React.ComponentType<SlideComponentProps> & {
  id: SlideId;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** If set, slide is only included when this tool is selected. */
  whenTool?: LaserTool;
};

/** Abstraction for a slide deck. Slideshow depends on this, not on concrete arrays (D). */
export interface SlideSource {
  /** The slides list is just the list of (slide) components. */
  readonly slides: ReadonlyArray<SlideComponent>;
  getSlideLabel(slide: SlideComponent, index: number): string;
}

/** Builds an accessible label for a slide (e.g. for aria-label). */
export function getSlideLabel(slide: SlideComponent): string {
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
