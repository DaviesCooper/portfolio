import {
  MIME_APPLICATION_PDF,
  MIME_PREFIX_AUDIO,
  MIME_PREFIX_IMAGE,
  MIME_PREFIX_VIDEO,
  MIME_TEXT_MARKDOWN,
  MIME_TEXT_PLAIN,
  WINDOW_TYPE_AUDIO,
  WINDOW_TYPE_GENERIC,
  WINDOW_TYPE_IMAGE,
  WINDOW_TYPE_MARKDOWN,
  WINDOW_TYPE_PDF,
  WINDOW_TYPE_TEXT,
  WINDOW_TYPE_VIDEO,
} from '../types/mimeTypes';
import type { ViewerComponent } from '../types/viewer';
import type { WindowType } from '../types/window';

/**
 * Maps window types and MIME types to viewer components. Extensible (OCP).
 */
export class ViewerRegistry {
  private byType = new Map<WindowType, ViewerComponent>();
  private byMime = new Map<string, ViewerComponent>();

  registerType(type: WindowType, component: ViewerComponent): this {
    this.byType.set(type, component);
    return this;
  }

  registerMime(mime: string, component: ViewerComponent): this {
    this.byMime.set(mime, component);
    return this;
  }

  getViewer(type: WindowType, mimeType?: string): ViewerComponent | undefined {
    const byType = this.byType.get(type);
    if (byType) return byType;
    if (mimeType) {
      const exact = this.byMime.get(mimeType);
      if (exact) return exact;
      const [major] = mimeType.split('/');
      return this.byMime.get(major + '/*') ?? this.byMime.get('*');
    }
    return undefined;
  }

  /** Resolve window type from MIME for opening files. */
  static mimeToWindowType(mime: string): WindowType {
    if (mime.startsWith(MIME_PREFIX_IMAGE)) return WINDOW_TYPE_IMAGE;
    if (mime === MIME_TEXT_MARKDOWN) return WINDOW_TYPE_MARKDOWN;
    if (mime === MIME_TEXT_PLAIN) return WINDOW_TYPE_TEXT;
    if (mime.startsWith(MIME_PREFIX_AUDIO)) return WINDOW_TYPE_AUDIO;
    if (mime.startsWith(MIME_PREFIX_VIDEO)) return WINDOW_TYPE_VIDEO;
    if (mime === MIME_APPLICATION_PDF) return WINDOW_TYPE_PDF;
    return WINDOW_TYPE_GENERIC;
  }
}
