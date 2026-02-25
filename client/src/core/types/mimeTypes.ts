/**
 * MIME type string literals — single source of truth.
 * Use these everywhere instead of raw strings.
 */
export const MIME_TEXT_PLAIN = 'text/plain';
export const MIME_TEXT_MARKDOWN = 'text/markdown';
export const MIME_TEXT_HTML = 'text/html';
export const MIME_TEXT_XML = 'text/xml';
export const MIME_APPLICATION_JSON = 'application/json';
export const MIME_APPLICATION_XML = 'application/xml';
export const MIME_APPLICATION_PDF = 'application/pdf';
export const MIME_APPLICATION_OCTET_STREAM = 'application/octet-stream';

/** MIME major-type prefixes for viewer routing (e.g. image/, audio/, video/). */
export const MIME_PREFIX_IMAGE = 'image/';
export const MIME_PREFIX_AUDIO = 'audio/';
export const MIME_PREFIX_VIDEO = 'video/';

/** Window type strings — keep in sync with WindowType in types/window.ts. */
export const WINDOW_TYPE_IMAGE = 'image';
export const WINDOW_TYPE_MARKDOWN = 'markdown';
export const WINDOW_TYPE_AUDIO = 'audio';
export const WINDOW_TYPE_VIDEO = 'video';
export const WINDOW_TYPE_PDF = 'pdf';
export const WINDOW_TYPE_GENERIC = 'generic';
export const WINDOW_TYPE_TEXT = 'text';

/** MIME types we treat as text (cat prints content, open passes string to viewer). All others are binary. */
export const TEXT_MIMES = new Set([
  MIME_TEXT_PLAIN,
  MIME_TEXT_MARKDOWN,
  MIME_TEXT_HTML,
  MIME_TEXT_XML,
  MIME_APPLICATION_JSON,
  MIME_APPLICATION_XML,
]);
