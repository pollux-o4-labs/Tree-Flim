export type Values = Record<string, string>;
export type ContentField = { id: string; kind: 'text' | 'image' | 'attachment'; label: string; section: string; original: string; alt?: string };
export type RecordStatus = 'draft' | 'published' | 'archived' | 'trashed';
export type RecordLifecycle = 'upcoming' | 'ongoing' | 'ended';
export type JournalRecord = { id: string; category: string; title: string; subtitle: string; summary: string; image: string; imageAlt: string; paragraphs: string[]; note?: string; publishedAt?: string; eventStatus?: RecordLifecycle; status: RecordStatus; featured: boolean; createdAt: string; updatedAt: string };
export type ArchiveWork = { id: string; title: string; category: string; image: string; note: string; location?: string; status: RecordStatus; createdAt: string; updatedAt: string };
export type Checkpoint = { id: string; name: string; createdAt: string; values: Values; newsDraft?: JournalRecord[] };
export type Workspace = { schema: 1; revision: number; draft: Values; published: Values; checkpoints: Checkpoint[]; savedAt: string | null; newsDraft?: JournalRecord[]; newsPublished?: JournalRecord[]; archiveDraft?: ArchiveWork[]; archivePublished?: ArchiveWork[]; archiveCategories?: string[] };
export const emptyWorkspace = (): Workspace => ({ schema: 1, revision: 0, draft: {}, published: {}, checkpoints: [], savedAt: null });
export function validValues(value: unknown): value is Values {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([key, item]) => /^[\w.:/-]{1,200}$/.test(key) && typeof item === 'string' && item.length <= 15_000_000);
}
export function validWorkspace(value: unknown): value is Workspace {
  const w = value as Workspace | null;
  return !!w && w.schema === 1 && Number.isInteger(w.revision) && w.revision >= 0
    && validValues(w.draft) && validValues(w.published) && (w.savedAt === null || typeof w.savedAt === 'string')
    && Array.isArray(w.checkpoints) && w.checkpoints.every(c => typeof c.id === 'string' && typeof c.name === 'string' && typeof c.createdAt === 'string' && validValues(c.values) && (c.newsDraft === undefined || validJournalRecords(c.newsDraft)))
    && (w.newsDraft === undefined || validJournalRecords(w.newsDraft)) && (w.newsPublished === undefined || validJournalRecords(w.newsPublished)) && (w.archiveDraft === undefined || validArchiveWorks(w.archiveDraft)) && (w.archivePublished === undefined || validArchiveWorks(w.archivePublished))
    && (w.archiveCategories === undefined || (Array.isArray(w.archiveCategories) && w.archiveCategories.every(category => typeof category === 'string' && category.trim().length > 0)));
}
export function validArchiveWorks(value: unknown): value is ArchiveWork[] { return Array.isArray(value) && value.every(item => !!item && typeof item === 'object' && typeof (item as ArchiveWork).id === 'string' && typeof (item as ArchiveWork).title === 'string' && typeof (item as ArchiveWork).category === 'string' && typeof (item as ArchiveWork).image === 'string' && typeof (item as ArchiveWork).note === 'string' && ((item as ArchiveWork).location === undefined || typeof (item as ArchiveWork).location === 'string') && ['draft','published','archived','trashed'].includes((item as ArchiveWork).status) && typeof (item as ArchiveWork).createdAt === 'string' && typeof (item as ArchiveWork).updatedAt === 'string'); }
export function validJournalRecords(value: unknown): value is JournalRecord[] {
  return Array.isArray(value) && value.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Partial<JournalRecord>;
    return typeof record.id === 'string' && /^[a-z0-9-]{1,120}$/.test(record.id)
      && typeof record.category === 'string' && typeof record.title === 'string' && typeof record.subtitle === 'string'
      && typeof record.summary === 'string' && typeof record.image === 'string' && typeof record.imageAlt === 'string'
      && Array.isArray(record.paragraphs) && record.paragraphs.every((paragraph: unknown) => typeof paragraph === 'string')
      && (record.note === undefined || typeof record.note === 'string') && (record.publishedAt === undefined || typeof record.publishedAt === 'string')
      && (record.eventStatus === undefined || ['upcoming', 'ongoing', 'ended'].includes(record.eventStatus))
      && ['draft', 'published', 'archived', 'trashed'].includes(record.status as string) && typeof record.featured === 'boolean'
      && typeof record.createdAt === 'string' && typeof record.updatedAt === 'string';
  });
}
export function safeMediaUrl(value: string, image = false) {
  if (!value) return true;
  if (image && /^data:image\/(png|jpeg|webp|avif|gif);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  if (!image && /^data:application\/pdf;base64,[a-z0-9+/=]+$/i.test(value)) return true;
  try { const url = new URL(value, window.location.origin); return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)); } catch { return false; }
}
