import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import type { WindowState, WindowBounds } from '../../core/types/window';
import styles from './WindowChrome.module.css';

interface WindowChromeProps {
  window: WindowState;
  isActive: boolean;
  screenWidth: number;
  screenHeight: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onBoundsChange: (bounds: Partial<WindowBounds>) => void;
  children: React.ReactNode;
}

export function WindowChrome({
  window: win,
  isActive,
  screenWidth,
  screenHeight,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onBoundsChange,
  children,
}: WindowChromeProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasIframe, setHasIframe] = useState(false);
  const [iframeOverlayPassThrough, setIframeOverlayPassThrough] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;
    const handleFocusIn = (e: FocusEvent) => {
      if (el.contains(e.target as Node)) onFocus();
    };
    document.addEventListener('focusin', handleFocusIn, true);
    return () => document.removeEventListener('focusin', handleFocusIn, true);
  }, [onFocus]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    const check = () => {
      if (contentEl.querySelector('iframe')) setHasIframe(true);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(contentEl, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [win.id]);

  useEffect(() => {
    if (!isActive) setIframeOverlayPassThrough(false);
  }, [isActive]);

  const handleDragStart = useCallback(() => {
    setIsInteracting(true);
    onFocus();
  }, [onFocus]);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      setIsInteracting(false);
      onBoundsChange({ x: d.x, y: d.y });
    },
    [onBoundsChange]
  );

  const handleResizeStart = useCallback(() => {
    setIsInteracting(true);
    onFocus();
  }, [onFocus]);

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, pos: { x: number; y: number }) => {
      setIsInteracting(false);
      onBoundsChange({
        x: pos.x,
        y: pos.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
    },
    [onBoundsChange]
  );

  const bounds = win.bounds;
  const position = win.maximized
    ? { x: 0, y: 0, width: screenWidth, height: screenHeight - 28 }
    : { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };

  return (
    <Rnd
      position={{ x: position.x, y: position.y }}
      size={{ width: position.width, height: position.height }}
      minWidth={320}
      minHeight={200}
      disableDragging={win.maximized}
      enableResizing={!win.maximized}
      dragHandleClassName={styles.titlebar}
      onDragStart={handleDragStart}
      onResizeStart={handleResizeStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      className={`${styles.rnd} ${isActive ? styles.active : ''}`}
      style={{ zIndex: win.zIndex }}
    >
      <div ref={windowRef} className={styles.window} onMouseDown={onFocus}>
        <header className={styles.titlebar}>
          <img src="/logo.svg" alt="" className={styles.titleIcon} aria-hidden />
          <span className={styles.titleText}>{win.title}</span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.titlebarBtn}
              onClick={onMinimize}
              aria-label="Minimize"
            >
              <MinimizeIcon />
            </button>
            <button
              type="button"
              className={styles.titlebarBtn}
              onClick={onMaximize}
              aria-label={win.maximized ? 'Restore' : 'Maximize'}
            >
              {win.maximized ? <RestoreIcon /> : <MaximizeIcon />}
            </button>
            <button
              type="button"
              className={`${styles.titlebarBtn} ${styles.closeBtn}`}
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div ref={contentRef} className={`${styles.content} ${isInteracting ? styles.contentInteracting : ''}`}>
          {hasIframe && (
            <div
              className={styles.iframeFocusOverlay}
              style={{ pointerEvents: iframeOverlayPassThrough ? 'none' : 'auto' }}
              onClick={() => {
                onFocus();
                setIframeOverlayPassThrough(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-hidden
            />
          )}
          {children}
        </div>
      </div>
    </Rnd>
  );
}

function MinimizeIcon() {
  return <span className={styles.iconLine} style={{ width: 10 }} />;
}

function MaximizeIcon() {
  return (
    <span className={styles.iconBox}>
      <span className={styles.iconLine} style={{ width: 8, height: 1 }} />
    </span>
  );
}

function RestoreIcon() {
  return (
    <span className={styles.iconRestore}>
      <span className={styles.iconLine} style={{ width: 6, height: 1 }} />
      <span className={styles.iconLine} style={{ width: 6, height: 1, marginLeft: 2 }} />
    </span>
  );
}

function CloseIcon() {
  return (
    <span className={styles.iconX}>
      <span className={styles.iconLine} />
      <span className={styles.iconLine} />
    </span>
  );
}
