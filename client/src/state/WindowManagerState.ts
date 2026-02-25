import type { WindowId, WindowState, WindowBounds } from '../core/types/window';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 500;
const CASCADE_OFFSET = 28;

export interface WindowManagerState {
  windows: WindowState[];
  activeId: WindowId | null;
  nextId: number;
}

export function createInitialWindowManagerState(
  screenSize?: { width: number; height: number }
): WindowManagerState {
  if (!screenSize) {
    return { windows: [], activeId: null, nextId: 1 };
  }
  const bounds = getDefaultBounds([], screenSize.width, screenSize.height);
  const initialTerminal: WindowState = {
    id: 'win-1',
    type: 'terminal',
    title: 'Terminal',
    bounds,
    minimized: false,
    maximized: false,
    zIndex: 1,
    payload: undefined,
  };
  return {
    windows: [initialTerminal],
    activeId: 'win-1',
    nextId: 2,
  };
}

export function getDefaultBounds(
  existing: WindowState[],
  screenWidth: number,
  screenHeight: number
): WindowBounds {
  const idx = existing.length;
  const x = 80 + (idx % 6) * CASCADE_OFFSET;
  const y = 60 + (idx % 6) * CASCADE_OFFSET;
  const width = Math.min(DEFAULT_WIDTH, screenWidth - 40);
  const height = Math.min(DEFAULT_HEIGHT, screenHeight - 120);
  return {
    x: Math.max(0, Math.min(x, screenWidth - width - 20)),
    y: Math.max(0, Math.min(y, screenHeight - height - 80)),
    width,
    height,
  };
}

export type WindowAction =
  | { type: 'OPEN'; window: Pick<WindowState, 'type' | 'title'> & Partial<Pick<WindowState, 'payload' | 'minimized' | 'maximized'>> }
  | { type: 'CLOSE'; id: WindowId }
  | { type: 'FOCUS'; id: WindowId }
  | { type: 'UPDATE_BOUNDS'; id: WindowId; bounds: Partial<WindowBounds> }
  | { type: 'SET_MINIMIZED'; id: WindowId; minimized: boolean }
  | { type: 'SET_MAXIMIZED'; id: WindowId; maximized: boolean };

export function windowManagerReducer(
  state: WindowManagerState,
  action: WindowAction,
  screenSize: { width: number; height: number }
): WindowManagerState {
  switch (action.type) {
    case 'OPEN': {
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.zIndex), 0);
      const bounds = getDefaultBounds(state.windows, screenSize.width, screenSize.height);
      const newWindow: WindowState = {
        ...action.window,
        id: `win-${state.nextId}`,
        zIndex: maxZ + 1,
        bounds: { ...bounds },
        minimized: action.window.minimized ?? false,
        maximized: action.window.maximized ?? false,
      };
      return {
        ...state,
        nextId: state.nextId + 1,
        windows: [...state.windows, newWindow],
        activeId: newWindow.id,
      };
    }
    case 'CLOSE': {
      const windows = state.windows.filter(w => w.id !== action.id);
      const activeId =
        state.activeId === action.id
          ? (windows[windows.length - 1]?.id ?? null)
          : state.activeId;
      return { ...state, windows, activeId };
    }
    case 'FOCUS': {
      if (state.activeId === action.id) return state;
      const win = state.windows.find(w => w.id === action.id);
      if (!win) return state;
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.zIndex), 0);
      const windows = state.windows.map(w =>
        w.id === action.id ? { ...w, zIndex: maxZ + 1, minimized: false } : w
      );
      return { ...state, windows, activeId: action.id };
    }
    case 'UPDATE_BOUNDS': {
      const windows = state.windows.map(w =>
        w.id === action.id
          ? { ...w, bounds: { ...w.bounds, ...action.bounds } }
          : w
      );
      return { ...state, windows };
    }
    case 'SET_MINIMIZED': {
      const windows = state.windows.map(w =>
        w.id === action.id ? { ...w, minimized: action.minimized } : w
      );
      return { ...state, windows };
    }
    case 'SET_MAXIMIZED': {
      const windows = state.windows.map(w =>
        w.id === action.id ? { ...w, maximized: action.maximized } : w
      );
      return { ...state, windows };
    }
    default:
      return state;
  }
}
