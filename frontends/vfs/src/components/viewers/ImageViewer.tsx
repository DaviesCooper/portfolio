import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

export function ImageViewer({ payload }: ViewerProps) {
  const url = payload.url;
  if (!url) return <div className={styles.error}>No image URL</div>;
  return (
    <div className={styles.imageWrap}>
      <img src={url} alt={payload.filename ?? 'Image'} className={styles.image} />
    </div>
  );
}
