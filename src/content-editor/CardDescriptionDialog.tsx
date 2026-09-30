import { useEffect, useState } from 'react';
import { useControlledDialog } from '../shared/useControlledDialog';
import { X } from 'lucide-react';
import { siteIdentity } from '../content/siteIdentity';
import PhotoCardBack from '../shared/PhotoCardBack';
import PhotoCardView from '../shared/PhotoCardView';
import PreviewImage from '../shared/PreviewImage';
import './card-description-dialog.css';

type CardDetails = { category: string; title: string; location: string; note: string; image: string };
type Props = { slot: number | null; details: CardDetails | null; onClose: () => void; onChange: (field: 'story' | 'location' | 'note', value: string) => void };
export default function CardDescriptionDialog({ slot, details, onClose, onChange }: Props) {
  const { dialogRef, restoreFocus } = useControlledDialog(slot !== null && details !== null);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { setFlipped(false); }, [slot]);
  const field = (name: 'story' | 'location' | 'note', value: string, label: string) => name === 'note'
    ? <textarea aria-label={`강조 사진 ${(slot ?? 0) + 1} ${label}`} value={value} rows={3} tabIndex={flipped ? 0 : -1} onChange={e => onChange(name, e.target.value)} />
    : <input aria-label={`강조 사진 ${(slot ?? 0) + 1} ${label}`} value={value} maxLength={120} tabIndex={flipped ? 0 : -1} onChange={e => onChange(name, e.target.value)} />;
  return <dialog ref={dialogRef} className="story-card-dialog ui-scrollbar" aria-label="강조 사진 카드" onClose={() => { onClose(); restoreFocus(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className="story-card-close" type="button" aria-label="사진 닫기" onClick={onClose}><X size={22} /></button>
    {details && <PhotoCardView flipped={flipped} onFlip={() => setFlipped(value => !value)} flipLabel={flipped ? '사진으로 돌아가기' : '뒤집어서 내용 편집'}
      front={<><PreviewImage previewWidth={null} src={details.image} alt={details.title} /><span>{details.title}</span><small>{siteIdentity.artistNameLatin} / {details.category}</small></>}
      back={<PhotoCardBack className="card-back" ariaHidden={!flipped} title={field('story', details.title, '제목')} category={details.category}
        location={field('location', details.location, '장소 / 날짜')} note={field('note', details.note, '카드 뒷면 설명')} signature={siteIdentity.signature} />}>
      {flipped && <p className="story-card-edit-hint">내용을 눌러 편집 · 닫은 후 저장</p>}
    </PhotoCardView>}
  </dialog>;
}
