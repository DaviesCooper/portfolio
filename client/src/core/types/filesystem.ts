/**
 * Virtual filesystem types — dependency inversion: shell depends on IVirtualFilesystem.
 */

export type NodeKind = 'file' | 'directory';

export interface VfsNode {
  kind: NodeKind;
  name: string;
  /** MIME type for files. */
  mimeType?: string;
  /** UTF-8 text content for text files. */
  content?: string;
  /** Base64 for binary (or use content for small binaries). */
  base64?: string;
  /** Public URL to fetch file content (readFile/readFileUtf8 return Promises). */
  url?: string;
  children?: Map<string, VfsNode>;
}

export interface IVirtualFilesystem {
  resolve(path: string, cwd: string): string;
  getNode(path: string): VfsNode | null;
  readFile(path: string): Promise<ArrayBuffer> | ArrayBuffer;
  readFileUtf8(path: string): Promise<string> | string;
  readDir(path: string): VfsNode[] | null;
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  isFile(path: string): boolean;
  /** Write UTF-8 text to a file. Creates the file if it does not exist; parent directory must exist. */
  writeFileUtf8(path: string, content: string): void;
}
