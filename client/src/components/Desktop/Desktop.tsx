import { useCallback, useMemo } from 'react';
import { WindowChrome } from '../WindowChrome/WindowChrome';
import { Taskbar } from '../Taskbar/Taskbar';
import { TerminalWindow } from '../TerminalWindow/TerminalWindow';
import { EditorWindow } from '../EditorWindow/EditorWindow';
import type { WindowState, WindowId, IWindowHost } from '../../core/types/window';
import type { WindowBounds } from '../../core/types/window';
import { ViewerRegistry } from '../../core/viewers/ViewerRegistry';
import { ImageViewer } from '../viewers/ImageViewer';
import { MarkdownViewer } from '../viewers/MarkdownViewer';
import { AudioViewer } from '../viewers/AudioViewer';
import { VideoViewer } from '../viewers/VideoViewer';
import { PdfViewer } from '../viewers/PdfViewer';
import { TextViewer } from '../viewers/TextViewer';
import styles from './Desktop.module.css';

export interface DesktopProps {
  windows: WindowState[];
  activeId: WindowId | null;
  screenWidth: number;
  screenHeight: number;
  dispatch: (action: import('../../state/WindowManagerState').WindowAction) => void;
  commandRegistry: import('../../core/commands/CommandRegistry').CommandRegistry;
  fs: import('../../core/fs/VirtualFilesystem').VirtualFilesystem;
  openInViewer: (path: string, mimeType: string, content: ArrayBuffer | string, options?: { sourceUrl?: string }) => void;
  onVfsRootCleared?: () => void;
}

const viewerRegistry = new ViewerRegistry();
viewerRegistry
  .registerType('terminal', () => null)
  .registerType('image', ImageViewer)
  .registerType('markdown', MarkdownViewer)
  .registerType('audio', AudioViewer)
  .registerType('video', VideoViewer)
  .registerType('pdf', PdfViewer)
  .registerType('text', TextViewer);

export function Desktop({
  windows,
  activeId,
  screenWidth,
  screenHeight,
  dispatch,
  commandRegistry,
  fs,
  openInViewer,
  onVfsRootCleared,
}: DesktopProps) {
  const windowHost = useMemo<IWindowHost>(
    () => ({
      openWindow: (state) => {
        dispatch({ type: 'OPEN', window: state });
        return 'win-placeholder';
      },
      closeWindow: (id) => dispatch({ type: 'CLOSE', id }),
      focusWindow: (id) => dispatch({ type: 'FOCUS', id }),
    }),
    [dispatch]
  );

  const handleOpenTerminal = useCallback(() => {
    dispatch({
      type: 'OPEN',
      window: {
        type: 'terminal',
        title: 'Terminal',
        payload: undefined,
      },
    });
  }, [dispatch]);

  const visibleWindows = windows.filter(w => !w.minimized);

  return (
    <div className={styles.desktop}>
      <div className={styles.windowArea}>
        {visibleWindows.map(win => {
          const isActive = win.id === activeId;
          const onFocus = () => dispatch({ type: 'FOCUS', id: win.id });
          const onClose = () => {
            if (win.payload?.url?.startsWith?.('blob:')) {
              URL.revokeObjectURL(win.payload.url);
            }
            dispatch({ type: 'CLOSE', id: win.id });
          };
          const onMinimize = () => dispatch({ type: 'SET_MINIMIZED', id: win.id, minimized: true });
          const onMaximize = () =>
            dispatch({ type: 'SET_MAXIMIZED', id: win.id, maximized: !win.maximized });
          const onBoundsChange = (bounds: Partial<WindowBounds>) =>
            dispatch({ type: 'UPDATE_BOUNDS', id: win.id, bounds });

          let content: React.ReactNode;
          if (win.type === 'terminal') {
            content = (
              <TerminalWindow
                commandRegistry={commandRegistry}
                fs={fs}
                windowHost={windowHost}
                openInViewer={openInViewer}
                onVfsRootCleared={onVfsRootCleared}
              />
            );
          } else if (win.type === 'editor' && win.payload) {
            content = <EditorWindow payload={win.payload} fs={fs} />;
          } else {
            const Viewer = viewerRegistry.getViewer(win.type, win.payload?.mimeType);
            content = Viewer && win.payload ? (
              <Viewer payload={win.payload} />
            ) : (
              <div className={styles.unknown}>Unknown content type</div>
            );
          }

          return (
            <WindowChrome
              key={win.id}
              window={win}
              isActive={isActive}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              onFocus={onFocus}
              onClose={onClose}
              onMinimize={onMinimize}
              onMaximize={onMaximize}
              onBoundsChange={onBoundsChange}
            >
              {content}
            </WindowChrome>
          );
        })}
      </div>
      <Taskbar
        windows={windows}
        activeId={activeId}
        onFocus={(id) => dispatch({ type: 'FOCUS', id })}
        onOpenTerminal={handleOpenTerminal}
      />
    </div>
  );
}
