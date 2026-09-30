import { useEffect, useState } from 'react';
import type { ArchiveWork } from './model';
import { readWorkspace, WORKSPACE_UPDATED } from './repository';

// Order is metadata; photographs always come from the published snapshot.
export function usePublishedArchive() {
  const [archive, setArchive] = useState<{ works: ArchiveWork[] | null; categories: string[]; ready: boolean }>({ works: null, categories: [], ready: false });
  useEffect(() => {
    let active = true;
    let request = 0;
    const refresh = () => {
      const current = ++request;
      void readWorkspace().then(workspace => {
        if (active && current === request) setArchive({ ready: true, works: (window.parent !== window && new URLSearchParams(location.search).has('editor') ? workspace.archiveDraft : workspace.archivePublished) ?? null, categories: workspace.archiveCategories ?? [] });
      }).catch(() => { if (active && current === request) setArchive(old => ({ ...old, ready: true })); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(WORKSPACE_UPDATED, refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener(WORKSPACE_UPDATED, refresh); };
  }, []);
  return archive;
}
