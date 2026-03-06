import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { BlueScreen } from './components/BlueScreen/BlueScreen';
import {
  createInitialWindowManagerState,
  windowManagerReducer,
} from './state/WindowManagerState';
import { createCommandRegistry } from './core/commands';
import { VirtualFilesystem } from './core/fs/VirtualFilesystem';
import { createDefaultFs } from './core/fs/defaultFs';
import { ViewerRegistry } from './core/viewers/ViewerRegistry';
import type { WindowState } from './core/types/window';
import styles from './App.module.css';

const commandRegistry = createCommandRegistry();
function createFs() {
  return new VirtualFilesystem(createDefaultFs(commandRegistry.names()));
}

function getScreenSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function App() {
  const [vfsEmpty, setVfsEmpty] = useState(false);
  const [fs, setFs] = useState(createFs);
  const onVfsRootCleared = useCallback(() => setVfsEmpty(true), []);
  const onRestoreFs = useCallback(() => {
    setVfsEmpty(false);
    setFs(createFs());
  }, []);

  const [wmState, dispatch] = useReducer(
    (state: import('./state/WindowManagerState').WindowManagerState, action: import('./state/WindowManagerState').WindowAction) =>
      windowManagerReducer(state, action, getScreenSize()),
    getScreenSize(),
    createInitialWindowManagerState
  );

  const openInViewer = useCallback(
    (path: string, mimeType: string, content: ArrayBuffer | string, options?: { sourceUrl?: string }) => {
      const filename = path.split('/').pop() ?? 'file';
      const type = ViewerRegistry.mimeToWindowType(mimeType);
      let payload: WindowState['payload'];
      if (typeof content === 'string') {
        payload = { text: content, filename, ...(options?.sourceUrl && { sourceUrl: options.sourceUrl }) };
      } else {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        payload = { url, filename, mimeType };
      }
      dispatch({
        type: 'OPEN',
        window: { type, title: filename, payload },
      });
    },
    []
  );

  const prevWindowsRef = useRef<WindowState[]>([]);
  useEffect(() => {
    const prev = new Set(prevWindowsRef.current.map(w => w.id));
    for (const w of wmState.windows) prev.delete(w.id);
    for (const w of prevWindowsRef.current) {
      if (!wmState.windows.some(win => win.id === w.id) && w.payload?.url?.startsWith?.('blob:')) {
        URL.revokeObjectURL(w.payload.url);
      }
    }
    prevWindowsRef.current = wmState.windows;
  }, [wmState.windows]);

  const screenSize = getScreenSize();

  if (vfsEmpty) {
    return <BlueScreen onRestore={onRestoreFs} />;
  }

  return (
    <div className={styles.desktop}>
      <Desktop
        windows={wmState.windows}
        activeId={wmState.activeId}
        screenWidth={screenSize.width}
        screenHeight={screenSize.height}
        dispatch={dispatch}
        commandRegistry={commandRegistry}
        fs={fs}
        openInViewer={openInViewer}
        onVfsRootCleared={onVfsRootCleared}
      />
    </div>
  );
}
