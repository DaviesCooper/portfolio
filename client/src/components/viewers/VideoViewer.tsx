import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

export function VideoViewer({ payload }: ViewerProps) {
  const url = payload.url;
  if (!url) return <div className={styles.error}>No video URL</div>;
  return (
    <div className={styles.mediaWrap}>
      <video src={url} controls className={styles.video} />
    </div>
  );
}
