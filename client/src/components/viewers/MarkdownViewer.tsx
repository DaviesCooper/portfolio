import { useMemo } from 'react';
import type { Element, Root } from 'hast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { PluggableList } from 'unified';
import type { ViewerProps } from '../../core/types/viewer';
import styles from './Viewers.module.css';

/** Sanitize schema that allows iframe (e.g. YouTube embeds), video, and p with align. */
const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'iframe', 'video'],
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className', 'image-pair'],
    ],
    iframe: [
      'src',
      'title',
      'width',
      'height',
      'allow',
      'allowFullScreen',
      'frameBorder',
    ],
    video: ['src', 'controls', 'width', 'playsInline'],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ['http', 'https'],
  },
};

/** Rehype plugin: resolve relative img src against a base URL. Use absolute URLs (origin + path) so images load reliably. */
function rehypeRewriteRelativeMedia(baseUrl: string, origin: string) {
  const pathBase = baseUrl.replace(/\/[^/]*$/, '/');
  const fullBase = origin ? origin.replace(/\/$/, '') + pathBase : pathBase;
  return (tree: Root) => {
    const visit = (node: Root | Element | undefined): void => {
      if (!node || !('type' in node)) return;
      if (node.type === 'element') {
        if ((node.tagName === 'img' || node.tagName === 'video') && node.properties?.src) {
          const src = String(node.properties.src);
          if (!src.startsWith('http') && !src.startsWith('data:')) {
            const resolved = src.startsWith('/') ? origin + src : fullBase + src.replace(/^\.\//, '');
            node.properties.src = resolved;
          }
        }
        if (node.tagName === 'a' && node.properties?.href) {
          const href = String(node.properties.href);
          if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            const resolved = href.startsWith('/') ? origin + href : fullBase + href.replace(/^\.\//, '');
            node.properties.href = resolved;
          }
        }
        if (node.children) {
          for (const child of node.children) {
            if (child && typeof child === 'object' && 'type' in child && child.type === 'element') {
              visit(child as Element);
            }
          }
        }
      }
      if (node.type === 'root' && node.children) {
        for (const child of node.children) {
          if (child && typeof child === 'object' && 'type' in child && child.type === 'element') {
            visit(child as Element);
          }
        }
      }
    };
    visit(tree);
  };
}

/** Resolve image src to absolute URL when document has a sourceUrl (e.g. from VFS URL-based file). */
function resolveImgSrc(src: string | undefined, sourceUrl: string | undefined): string | undefined {
  if (!src || src.startsWith('http') || src.startsWith('data:')) return src;
  if (!sourceUrl || typeof window === 'undefined') return src;
  const origin = window.location.origin;
  const pathBase = sourceUrl.replace(/\/[^/]*$/, '/');
  const fullBase = origin.replace(/\/$/, '') + pathBase;
  if (src.startsWith('/')) return origin + src;
  return fullBase + src.replace(/^\.\//, '');
}

export function MarkdownViewer({ payload }: ViewerProps) {
  const content = payload.text ?? (payload.url ? null : '');
  const sourceUrl = payload.sourceUrl;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rehypePlugins = useMemo(() => {
    const plugins: PluggableList = [
      [rehypeSanitize, markdownSanitizeSchema],
    ];
    if (sourceUrl) {
      plugins.unshift(rehypeRewriteRelativeMedia(sourceUrl, origin));
    }
    return plugins;
  }, [sourceUrl, origin]);

  const imgComponent = useMemo(
    () =>
      sourceUrl
        ? (props: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) => {
            const { src, alt, node: _node, ...rest } = props;
            return <img src={resolveImgSrc(src, sourceUrl)} alt={alt ?? ''} {...rest} />;
          }
        : undefined,
    [sourceUrl]
  );

  const videoComponent = useMemo(
    () =>
      sourceUrl
        ? (props: React.VideoHTMLAttributes<HTMLVideoElement> & { node?: unknown }) => {
            const { src, node: _node, ...rest } = props;
            const resolvedSrc = resolveImgSrc(src, sourceUrl);
            return <video src={resolvedSrc} controls playsInline {...rest} />;
          }
        : undefined,
    [sourceUrl]
  );

  if (content == null) return <div className={styles.error}>No content</div>;

  return (
    <div className={styles.markdownWrap} tabIndex={-1}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, ...rehypePlugins]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          ...(imgComponent && { img: imgComponent }),
          ...(videoComponent && { video: videoComponent }),
          table: ({ children, ...props }) => (
            <div className={styles.tableScroll}>
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
