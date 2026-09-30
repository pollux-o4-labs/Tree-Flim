import PreviewImage from '../shared/PreviewImage';
type Chapter = { id: string; name: string; images: string[] };
type Props = { chapters: Chapter[]; selected: string; disabled: boolean; onSelect: (id: string) => void };
export default function StoryChapterList({ chapters, selected, disabled, onSelect }: Props) {
  return <aside className="story-chapter-list" aria-label="메인 챕터">
    <h2>메인 챕터</h2><p>챕터를 선택한 뒤 컬렉션과<br/>강조 사진 3장을 정하세요.</p>
    <ol>{chapters.map((chapter, index) => <li key={chapter.id} className={selected === chapter.id ? 'is-selected' : ''}>
      <button className="story-chapter-select" aria-pressed={selected === chapter.id} disabled={disabled} onClick={() => onSelect(chapter.id)}><small>CHAPTER {String(index + 1).padStart(2, '0')}</small><strong>{chapter.name}</strong><span className="story-chapter-thumbs">{chapter.images.map((src, i) => <PreviewImage key={i} previewWidth={240} src={src} alt=""/>)}</span></button>
    </li>)}</ol>
  </aside>;
}
