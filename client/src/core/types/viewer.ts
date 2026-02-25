/**
 * Content viewer types — viewers render a given payload in a window.
 */

import type { ComponentType } from 'react';
import type { WindowPayload } from './window';

export interface ViewerProps {
  payload: WindowPayload;
  onClose?: () => void;
}

/** Registry maps MIME types / window types to viewer components. Extensible (OCP). */
export type ViewerComponent = ComponentType<ViewerProps>;
