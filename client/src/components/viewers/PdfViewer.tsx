import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

export function PdfViewer({ payload }: ViewerProps) {
  const url = payload.url;
  if (!url) return <div className={styles.error}>No PDF URL</div>;
  return (
    <div className={styles.pdfWrap}>
      <iframe src={url} title={payload.filename ?? 'PDF'} className={styles.pdfFrame} />
    </div>
  );
}
