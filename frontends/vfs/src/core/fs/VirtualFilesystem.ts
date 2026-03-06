import { MIME_TEXT_PLAIN } from '../types/mimeTypes';
import type { IVirtualFilesystem, VfsNode } from '../types/filesystem';

function normalizePath(path: string): string {
  const parts = path.replace(/\/+/g, '/').split('/').filter(Boolean);
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') {
      resolved.pop();
      continue;
    }
    resolved.push(p);
  }
  return '/' + resolved.join('/');
}

export class VirtualFilesystem implements IVirtualFilesystem {
  constructor(private readonly root: VfsNode) {
    if (root.kind !== 'directory') throw new Error('Root must be a directory');
  }

  resolve(path: string, cwd: string): string {
    const base = path.startsWith('/') ? '/' : normalizePath(cwd);
    const joined = path.startsWith('/') ? path : base === '/' ? '/' + path : base + '/' + path;
    return normalizePath(joined);
  }

  getNode(path: string): VfsNode | null {
    const abs = normalizePath(path);
    if (abs === '/') return this.root;
    const parts = abs.slice(1).split('/');
    let current: VfsNode = this.root;
    for (const name of parts) {
      if (current.kind !== 'directory' || !current.children?.has(name)) return null;
      current = current.children!.get(name)!;
    }
    return current;
  }

  private readFileRaw(path: string): VfsNode | null {
    const node = this.getNode(path);
    if (!node || node.kind !== 'file') return null;
    return node;
  }

  readFile(path: string): ArrayBuffer | Promise<ArrayBuffer> {
    const node = this.readFileRaw(path);
    if (!node) throw new Error(`No such file: ${path}`);
    if (node.content !== undefined) {
      return new TextEncoder().encode(node.content).buffer;
    }
    if (node.base64) {
      const binary = atob(node.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }
    if (node.url) {
      return fetch(node.url).then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${node.url}`);
        return r.arrayBuffer();
      });
    }
    return new ArrayBuffer(0);
  }

  readFileUtf8(path: string): string | Promise<string> {
    const node = this.readFileRaw(path);
    if (!node) throw new Error(`No such file: ${path}`);
    if (node.content !== undefined) return node.content;
    if (node.url) {
      return fetch(node.url).then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${node.url}`);
        return r.text();
      });
    }
    const buf = this.readFile(path);
    if (buf instanceof Promise) {
      return buf.then((b) => new TextDecoder().decode(b));
    }
    return new TextDecoder().decode(buf);
  }

  readDir(path: string): VfsNode[] | null {
    const node = path === '/' ? this.root : this.getNode(path);
    if (!node || node.kind !== 'directory') return null;
    return node.children ? Array.from(node.children.values()) : [];
  }

  exists(path: string): boolean {
    return this.getNode(path) !== null;
  }

  isDirectory(path: string): boolean {
    const node = this.getNode(path);
    return node?.kind === 'directory';
  }

  isFile(path: string): boolean {
    const node = this.getNode(path);
    return node?.kind === 'file';
  }

  writeFileUtf8(path: string, content: string): void {
    const abs = normalizePath(path);
    if (abs === '/') throw new Error('Cannot write to root');
    const lastSlash = abs.lastIndexOf('/');
    const parentPath = lastSlash <= 0 ? '/' : abs.slice(0, lastSlash);
    const name = lastSlash <= 0 ? abs.slice(1) : abs.slice(lastSlash + 1);
    const parent = parentPath === '/' ? this.root : this.getNode(parentPath);
    if (!parent || parent.kind !== 'directory') throw new Error(`No such directory: ${parentPath}`);
    if (!parent.children) parent.children = new Map();
    const existing = parent.children.get(name);
    if (existing) {
      if (existing.kind !== 'file') throw new Error(`Not a file: ${path}`);
      (existing as VfsNode).content = content;
      return;
    }
    parent.children.set(name, { kind: 'file', name, mimeType: MIME_TEXT_PLAIN, content });
  }
}
