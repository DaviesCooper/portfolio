import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

export function AudioViewer({ payload }: ViewerProps) {
  const url = payload.url;
  if (!url) return <div className={styles.error}>No audio URL</div>;
  return (
    <div className={styles.mediaWrap}>
      <audio src={url} controls className={styles.audio} />
    </div>
  );
}
