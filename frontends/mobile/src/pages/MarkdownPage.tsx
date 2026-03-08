import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Root } from 'hast';
import styles from './MarkdownPage.module.css';

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'video'],
  attributes: {
    ...defaultSchema.attributes,
    video: ['src', 'controls', 'width', 'playsInline'],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https'],
  },
};

function rehypeResolveMedia(options: { baseUrl: string; origin: string }) {
  const { baseUrl, origin } = options;
  const pathBase = baseUrl.replace(/\/[^/]*$/, '/');
  const fullBase = origin.replace(/\/$/, '') + pathBase;
  return (tree: Root) => {
    const visit = (node: unknown): void => {
      if (!node || typeof node !== 'object' || !('type' in node)) return;
      const n = node as { type: string; tagName?: string; properties?: Record<string, unknown>; children?: unknown[] };
      if (n.type === 'element') {
        if ((n.tagName === 'img' || n.tagName === 'video') && n.properties?.src) {
          const src = String(n.properties.src);
          if (!src.startsWith('http') && !src.startsWith('data:')) {
            n.properties.src = src.startsWith('/') ? origin + src : fullBase + src.replace(/^\.\//, '');
          }
        }
        if (n.tagName === 'a' && n.properties?.href) {
          const href = String(n.properties.href);
          if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            n.properties.href = href.startsWith('/') ? origin + href : fullBase + href.replace(/^\.\//, '');
          }
        }
        n.children?.forEach(visit);
      }
      if (n.type === 'root' && n.children) {
        n.children.forEach(visit);
      }
    };
    visit(tree);
  };
}

interface MarkdownPageProps {
  url: string;
  title: string;
}

export function MarkdownPage({ url, title }: MarkdownPageProps) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
        return r.text();
      })
      .then(setText)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [url]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rehypePlugins = useMemo(
    () => [
      [rehypeResolveMedia, { baseUrl: url, origin }],
      [rehypeSanitize, markdownSanitizeSchema],
    ],
    [url, origin]
  );

  if (error) {
    return (
      <div className={styles.wrap}>
        <h1>{title}</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (text === null) {
    return (
      <div className={styles.wrap}>
        <h1>{title}</h1>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <article className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.markdown}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={rehypePlugins}
        >
          {text}
        </ReactMarkdown>
      </div>
    </article>
  );
}
