import { FolderOpen, GripVertical, LayoutGrid } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  categories: string[];
  selected: string;
  counts: Record<string, number>;
  disabled: boolean;
  sortable?: boolean;
  onSelect: (name: string) => void;
  onSave: (order: string[]) => Promise<boolean>;
};
export default function ArchiveCollectionList({ categories, selected, counts, disabled, sortable = true, onSelect, onSave }: Props) {
  const root = useRef<HTMLElement>(null);
  const drag = useRef<{ name: string; y: number; target: string; after: boolean } | null>(null);
  const [marker, setMarker] = useState<{ name: string; target: string; after: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const busy = pending || disabled;
  function updateTarget(y: number) {
    const current = drag.current;
    if (!current || !root.current) return;
    current.y = y;
    const rows = [...root.current.querySelectorAll<HTMLElement>('[data-collection]')];
    const row = rows.find(el => { const rect = el.getBoundingClientRect(); return y >= rect.top && y <= rect.bottom; });
    if (!row) return;
    const rect = row.getBoundingClientRect();
    current.target = row.dataset.collection!;
    current.after = y > rect.top + rect.height / 2;
    setMarker({ ...current });
  }
  useEffect(() => {
    if (!marker) return;
    let frame: number;
    const tick = () => {
      const current = drag.current;
      const element = root.current;
      if (current && element) {
        const rect = element.getBoundingClientRect();
        const delta = current.y < rect.top + 36 ? -6 : current.y > rect.bottom - 36 ? 6 : 0;
        if (delta) { element.scrollTop += delta; updateTarget(current.y); }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [Boolean(marker)]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const details = root.current?.closest('details');
      if (details && !details.contains(event.target as Node) && !drag.current) details.removeAttribute('open');
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  async function finish() {
    const current = drag.current;
    drag.current = null; setMarker(null);
    if (!current || current.name === current.target) return;
    const original = categories.filter(name => name !== '전체');
    const next = original.filter(name => name !== current.name);
    const index = next.indexOf(current.target);
    if (index < 0) return;
    next.splice(index + Number(current.after), 0, current.name);
    if (next.every((name, i) => name === original[i])) return;
    setPending(true);
    try { await onSave(next); } finally { setPending(false); }
  }
  return <nav ref={root} className="archive-collection-list archive-sortable-list ui-scrollbar" aria-label="컬렉션 필터" aria-busy={busy}>
    {categories.map(name => <div key={name} data-collection={name === '전체' ? undefined : name}
      className={`archive-sortable-row${marker?.name === name ? ' is-dragging' : ''}${marker && marker.target === name && marker.name !== name ? marker.after ? ' drop-after' : ' drop-before' : ''}`}>
      <button className="archive-collection-select" aria-pressed={selected === name} title={name} onClick={event => { onSelect(name); event.currentTarget.closest('details')?.removeAttribute('open'); }}>
        {name === '전체' ? <LayoutGrid size={17} /> : <FolderOpen size={17} />}<span>{name}</span><em>{counts[name] ?? 0}</em>
      </button>
      {sortable && name !== '전체' && <button className="archive-collection-grip" aria-label={`${name} 드래그하여 순서 변경`} title="드래그하여 순서 변경" disabled={busy}
        onPointerDown={event => {
          if (busy || event.button !== 0) return;
          event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { name, target: name, after: false, y: event.clientY }; setMarker({ ...drag.current });
        }}
        onPointerMove={event => { if (drag.current) updateTarget(event.clientY); }}
        onPointerUp={() => void finish()}
        onPointerCancel={() => { drag.current = null; setMarker(null); }}
        onLostPointerCapture={() => { drag.current = null; setMarker(null); }}
        onKeyDown={event => { if (event.key === 'Escape') { drag.current = null; setMarker(null); } }}><GripVertical size={15} /></button>}
    </div>)}
  </nav>;
}
