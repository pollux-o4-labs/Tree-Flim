import { concepts } from '../content/prototype-fixture';
import type { ArchiveWork, Values, Workspace } from './model';

export const initialArchiveWorks: ArchiveWork[] = concepts.flatMap(concept => concept.photos.map(photo => ({
  id: `seed-${photo.id}`, title: photo.story, category: concept.name, image: photo.src,
  note: '', location: '', status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})));

const fields = { story: 'title', category: 'category', src: 'image', note: 'note', location: 'location' } as const;
export function archivePhotoId(work: ArchiveWork) { return `archive-${work.id}`; }
function aliases(work: ArchiveWork) {
  return work.id.startsWith('seed-') ? [archivePhotoId(work), work.id.slice(5)] : [archivePhotoId(work)];
}

// Values are the screen editor's projection of the same archive record, never a second source.
function reconcile(works: ArchiveWork[], values: Values, previousWorks?: ArchiveWork[], previousValues?: Values) {
  const projected = { ...values };
  const records = works.map(work => {
    const record = { ...work };
    const before = previousWorks?.find(item => item.id === work.id);
    for (const [suffix, property] of Object.entries(fields) as [keyof typeof fields, typeof fields[keyof typeof fields]][]) {
      const keys = aliases(work).map(id => `photo.${id}.${suffix}`);
      const changedKey = keys.find(key => values[key] !== undefined && (!previousValues || values[key] !== previousValues[key]));
      // An explicit archive edit wins; otherwise import an edit made on the rendered page.
      if (changedKey && (!before || (work[property] ?? '') === (before[property] ?? ''))) record[property] = values[changedKey];
      for (const key of keys) projected[key] = record[property] ?? '';
    }
    return record;
  });
  return { records, values: projected };
}

export function reconcileArchiveContent(workspace: Workspace, previous?: Workspace): Workspace {
  const draft = reconcile(workspace.archiveDraft ?? initialArchiveWorks, workspace.draft, previous?.archiveDraft ?? initialArchiveWorks, previous?.draft);
  const published = reconcile(workspace.archivePublished ?? initialArchiveWorks, workspace.published, previous?.archivePublished ?? initialArchiveWorks, previous?.published);
  return { ...workspace, archiveDraft: draft.records, archivePublished: published.records, draft: draft.values, published: published.values };
}
