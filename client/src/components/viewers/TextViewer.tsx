import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

export function TextViewer({ payload }: ViewerProps) {
  const text = payload.text ?? '';
  return (
    <div className={styles.textWrap}>
      <pre className={styles.textPre}>{text}</pre>
    </div>
  );
}
