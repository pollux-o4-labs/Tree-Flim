import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MoreHorizontal, Search, X } from 'lucide-react';
import type { TotalConcept } from './totalTypes';
import './archive-collection-tabs.css';

type Props = { collections: readonly TotalConcept[]; selectedId: string; allCount: number; onSelect: (id: string) => void };
export default function ArchiveCollectionTabs({ collections, selectedId, allCount, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const visible = collections.slice(0, 3);
  const overflow = collections.slice(visible.length);
  const overflowSelected = overflow.find(collection => collection.id === selectedId);
  const choose = (id: string) => { onSelect(id); setOpen(false); setQuery(''); };
  return (
    <div className={`gallery-tabs archive-public-tabs${collections.length > 3 ? ' has-overflow' : ''}`} ref={root} onKeyDown={event => {
      if (event.key === 'Escape' && open) { setOpen(false); trigger.current?.focus(); }
    }}>
      <button aria-pressed={selectedId === 'all'} onClick={() => choose('all')}>전체 작품 <span>{allCount}</span></button>
      {visible.map(collection => <button key={collection.id} title={collection.name} aria-pressed={selectedId === collection.id} onClick={() => choose(collection.id)}>{collection.name}<span>{collection.photos.length}</span></button>)}
      {overflow.length > 0 && <div className="archive-public-more">
        <button ref={trigger} className="archive-more-trigger" aria-expanded={open} aria-pressed={Boolean(overflowSelected)} title={overflowSelected ? `선택: ${overflowSelected.name} · 더 많은 컬렉션` : '더 많은 컬렉션'} aria-label={overflowSelected ? `더 많은 컬렉션, 선택: ${overflowSelected.name}` : '더 많은 컬렉션'} onClick={() => { setOpen(!open); setQuery(''); }}>
          <MoreHorizontal size={16} /><b>{overflowSelected?.name ?? '더보기'}</b><ChevronDown className="archive-more-chevron" size={12} />
        </button>
      </div>}
      {overflow.length > 0 && open && <div className="archive-public-picker">
          <header><strong>컬렉션 {collections.length}</strong><button aria-label="컬렉션 목록 닫기" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={17} /></button></header>
          <label><Search size={15} /><input autoFocus={!compact} aria-label="컬렉션 검색" placeholder="컬렉션 찾기" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <div className="archive-public-options ui-scrollbar">
            {collections.filter(collection => collection.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map(collection => <button key={collection.id} aria-pressed={selectedId === collection.id} onClick={() => choose(collection.id)}>{collection.name}<span>{collection.photos.length}</span></button>)}
            {!collections.some(collection => collection.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && <p>찾는 컬렉션이 없습니다.</p>}
          </div>
      </div>}
    </div>
  );
}
