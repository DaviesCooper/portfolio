import type { ReactNode } from 'react';
import type { LaserTool, SlideComponent } from '../lib';

export function defineSlide(
  Component: React.ComponentType,
  meta: {
    id: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    whenTool?: LaserTool;
  }
): SlideComponent {
  const Slide = Component as SlideComponent;
  Slide.id = meta.id;
  Slide.title = meta.title;
  Slide.subtitle = meta.subtitle;
  Slide.whenTool = meta.whenTool;
  return Slide;
}
