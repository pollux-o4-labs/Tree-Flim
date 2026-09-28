export type Values = Record<string, string>;
export type ContentField = { id: string; kind: 'text' | 'image' | 'attachment'; label: string; section: string; original: string; alt?: string };
export type Checkpoint = { id: string; name: string; createdAt: string; values: Values };
export type Workspace = { schema: 1; revision: number; draft: Values; published: Values; checkpoints: Checkpoint[]; savedAt: string | null };
export const emptyWorkspace = (): Workspace => ({ schema: 1, revision: 0, draft: {}, published: {}, checkpoints: [], savedAt: null });
export function validValues(value: unknown): value is Values {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([key, item]) => /^[\w.:/-]{1,200}$/.test(key) && typeof item === 'string' && item.length <= 15_000_000);
}
export function validWorkspace(value: unknown): value is Workspace {
  const w = value as Workspace | null;
  return !!w && w.schema === 1 && Number.isInteger(w.revision) && w.revision >= 0
    && validValues(w.draft) && validValues(w.published) && (w.savedAt === null || typeof w.savedAt === 'string')
    && Array.isArray(w.checkpoints) && w.checkpoints.every(c => typeof c.id === 'string' && typeof c.name === 'string' && typeof c.createdAt === 'string' && validValues(c.values));
}
export function safeMediaUrl(value: string, image = false) {
  if (!value) return true;
  if (image && /^data:image\/(png|jpeg|webp|avif|gif);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  if (!image && /^data:application\/pdf;base64,[a-z0-9+/=]+$/i.test(value)) return true;
  try { const url = new URL(value, window.location.origin); return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)); } catch { return false; }
}
