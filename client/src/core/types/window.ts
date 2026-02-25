/**
 * Window system types — abstract so different window backends can be plugged in.
 */

export type WindowId = string;

export type WindowType =
  | 'terminal'
  | 'editor'
  | 'image'
  | 'markdown'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'text'
  | 'generic';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  id: WindowId;
  type: WindowType;
  title: string;
  bounds: WindowBounds;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  /** Viewer-specific payload (e.g. blob URL, raw content). */
  payload?: WindowPayload;
}

export interface WindowPayload {
  /** Blob URL or object URL for binary/text content. */
  url?: string;
  /** Raw text for markdown etc.; for editor, initial content. */
  text?: string;
  /** Filename for display. */
  filename?: string;
  /** Absolute VFS path for editor save target. */
  filePath?: string;
  mimeType?: string;
  /** Source URL (e.g. public path) for resolving relative links/images in markdown. */
  sourceUrl?: string;
}

/** Implemented by the window manager; used by commands to open files. */
export interface IWindowHost {
  openWindow(state: Omit<WindowState, 'id' | 'zIndex' | 'bounds'>): WindowId;
  closeWindow(id: WindowId): void;
  focusWindow(id: WindowId): void;
}
