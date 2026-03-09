import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
// import braceSvg from '../assets/curly-brace.svg?raw';

/** Uses your curly-brace.svg; height is set to match the measured content to its left. */
export function MeasuredBrace(props: { children: ReactNode; label?: string }): JSX.Element {
  const { children, label = '≈ 1 hr' } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const update = (): void => {
      if (el) setHeight(el.getBoundingClientRect().height);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  // Broken: curly-brace.svg removed during reorganization
  const braceSvg = '';
  const svgHtml = braceSvg
    .replace(/stroke:white/g, 'stroke:currentColor')
    .replace(/fill:white/g, 'fill:currentColor')
    .replace(/<svg /, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="measured-brace-svg" ');

  return (
    <div className="measured-brace-wrap">
      <div ref={contentRef} className="measured-brace-content">
        {children}
      </div>
      {height > 0 && (
        <div className="measured-brace-graphic" style={{ height: `${height}px` }}>
          <span
            className="measured-brace-svg-wrap"
            style={{ height: '100%', width: 'auto', display: 'block' }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
          {label && <span className="measured-brace-label">{label}</span>}
        </div>
      )}
    </div>
  );
}
