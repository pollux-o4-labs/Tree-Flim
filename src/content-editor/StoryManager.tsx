import { RotateCw } from 'lucide-react';
import ArchiveHeader from './ArchiveHeader';
import PreviewImage from '../shared/PreviewImage';
import StoryChapterList from './StoryChapterList';
import { useEffect, useState } from 'react';
import { concepts } from '../content/prototype-fixture';
import { readWorkspace, writeWorkspace, getCachedWorkspace } from './repository';
import { archivePhotoId } from './archiveContent';
import ArchiveNavigation from './ArchiveNavigation';
import CardDescriptionDialog from './CardDescriptionDialog';
import type { Values, Workspace } from './model';
import './story-manager.css';

export default function StoryManager() {
  const [workspace, setWorkspace] = useState<Workspace | null>(getCachedWorkspace);
  const [values, setValues] = useState<Values>(() => getCachedWorkspace()?.draft ?? {});
  const [chapter, setChapter] = useState(concepts[0].id);
  const [descriptionSlot, setDescriptionSlot] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    readWorkspace().then(w => { setWorkspace(w); setValues(w.draft); }).catch(e => setMessage(e.message));
  }, []);
  const dirty = workspace !== null && JSON.stringify(values) !== JSON.stringify(workspace.draft);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const photos = (workspace?.archivePublished ?? []).filter(work => work.status === 'published' && work.image);
  // Availability is public-only, while the editor reads its metadata from the
  // matching draft record so a saved draft is faithfully restored before it is
  // published.
  const draftPhotos = workspace?.archiveDraft ?? [];
  const editablePhoto = (photoId: string) => draftPhotos.find(photo => archivePhotoId(photo) === photoId)
    ?? photos.find(photo => archivePhotoId(photo) === photoId);
  const chapters = concepts;
  const concept = concepts.find(c => c.id === chapter)!;
  const key = (id: string, index: number) => `story.${id}.${index}`;
  const selectedId = (id: string, index: number, fallback: string) => {
    const value = values[key(id, index)] ?? fallback;
    return value.startsWith('archive-') ? value : `archive-seed-${value}`;
  };
  const selectedIds = [0, 1, 2].map(i => selectedId(concept.id, i, concept.photos[i].id));
  const collections = [...new Set(photos.map(p => p.category))];
  const collectionFor = (id: string, fallback: string) => values[`story.${id}.collection`] ?? fallback;
  const currentCollection = collectionFor(concept.id, concept.name);
  const candidates = photos.filter(p => p.category === currentCollection);
  const chooseCollection = (name: string) => {
    setValues(old => ({ ...old, [`story.${concept.id}.collection`]: name,
      ...Object.fromEntries([0, 1, 2].map(i => [key(concept.id, i), ''])) }));
    setMessage('선택한 컬렉션에서 강조할 사진 3장을 골라 주세요.');
  };
  const valid = concepts.every(c => {
    const ids = [0, 1, 2].map(i => selectedId(c.id, i, c.photos[i].id));
    return new Set(ids).size === 3 && ids.every(id => photos.some(p => archivePhotoId(p) === id && p.category === collectionFor(c.id, c.name)));
  });
  // Compare only the fields this editor publishes, including effective defaults.
  const pendingPublish = workspace !== null && concepts.some(c => {
    const publishedCollection = workspace.published[`story.${c.id}.collection`] ?? c.name;
    if (collectionFor(c.id, c.name) !== publishedCollection) return true;
    return [0, 1, 2].some(i => {
      const id = selectedId(c.id, i, c.photos[i].id);
      const publishedValue = workspace.published[key(c.id, i)] ?? c.photos[i].id;
      const publishedId = publishedValue.startsWith('archive-') ? publishedValue : `archive-seed-${publishedValue}`;
      if (id !== publishedId) return true;
      return (['story', 'location', 'note'] as const).some(field => {
        const detailKey = `photo.${id}.${field}`;
        return values[detailKey] !== undefined && values[detailKey] !== workspace.published[detailKey];
      });
    });
  });
  const showActions = workspace !== null && (dirty || pendingPublish || busy);
  const update = (index: number, value: string) => setValues(old => ({ ...old, [key(concept.id, index)]: value }));
  const photoValue = (photoId: string, field: 'story' | 'location' | 'note', fallback = '') => values[`photo.${photoId}.${field}`] ?? fallback;
  const updatePhoto = (photoId: string, field: 'story' | 'location' | 'note', value: string) => {
    setValues(old => ({ ...old, [`photo.${photoId}.${field}`]: value }));
  };
  const descriptionPhoto = descriptionSlot === null ? null : editablePhoto(selectedIds[descriptionSlot]);
  const descriptionPhotoId = descriptionPhoto ? archivePhotoId(descriptionPhoto) : '';
  const descriptionTitle = descriptionPhoto ? photoValue(descriptionPhotoId, 'story', descriptionPhoto.title) : '';
  const descriptionLocation = descriptionPhoto ? photoValue(descriptionPhotoId, 'location', descriptionPhoto.location ?? '') : '';
  const descriptionNote = descriptionPhoto ? photoValue(descriptionPhotoId, 'note', descriptionPhoto.note) : '';
  const move = (index: number, direction: number) => setValues(old => ({ ...old,
    [key(concept.id, index)]: selectedIds[index + direction],
    [key(concept.id, index + direction)]: selectedIds[index],
  }));
  const save = async (publish: boolean) => {
    if (!workspace || busy || (publish && !valid)) return false;
    setBusy(true);
    try {
      const published = { ...workspace.published };
      if (publish) concepts.forEach(c => { published[`story.${c.id}.collection`] = collectionFor(c.id, c.name); });
      if (publish) concepts.forEach(c => [0, 1, 2].forEach(i => {
        published[key(c.id, i)] = selectedId(c.id, i, c.photos[i].id);
      }));
      // The three cards are a focused editor for the same archive records.  When
      // applying them publicly, promote only their visible-card metadata too.
      if (publish) concepts.flatMap(c => [0, 1, 2].map(i => selectedId(c.id, i, c.photos[i].id)))
        .forEach(photoId => (['story', 'location', 'note'] as const).forEach(field => {
          const detailKey = `photo.${photoId}.${field}`;
          if (values[detailKey] !== undefined) published[detailKey] = values[detailKey];
        }));
      const next = await writeWorkspace({ ...workspace, draft: values, published });
      setWorkspace(next); setValues(next.draft);
      setMessage(publish ? '챕터 컬렉션과 강조 사진을 공개 적용했습니다.' : '선택을 초안으로 저장했습니다. 공개 적용 전까지 방문객 화면은 바뀌지 않습니다.');
      return true;
    } catch (error) { setMessage((error as Error).message); return false; }
    finally { setBusy(false); }
  };
  return <main className={`story-manager${showActions ? " has-pending-actions" : ""}`}>
    <ArchiveHeader backHref="/admin/content/archive" backLabel="아카이브" title="강조 사진" dirty={dirty} status={!workspace ? '불러오는 중' : busy ? '저장 중…' : dirty ? '저장하지 않은 변경' : pendingPublish ? '초안 저장됨 · 공개 전' : '모든 변경 반영됨'}>
    </ArchiveHeader>
    <ArchiveNavigation featured />
    <section className="story-manager-heading"><small>ARCHIVE / HOME</small><h1>메인 강조 사진</h1>
      <p>챕터마다 컬렉션 하나와 강조 사진 세 장을 고르세요. 제목과 카드 뒷면 정보도 이곳에서 함께 설정합니다.</p>
    </section>
    {message && <p className="story-status" role="status">{message}</p>}
    {workspace && !valid && <p role="alert">공개되지 않거나 삭제된 선택이 있습니다. 각 챕터의 컬렉션에서 서로 다른 공개 사진 3장을 선택해 주세요.</p>}
    <div className="story-curation-layout">
    <StoryChapterList chapters={chapters.map(c => ({ id: c.id, name: collectionFor(c.id, c.name), images: [0, 1, 2].flatMap(i => { const photo = photos.find(p => archivePhotoId(p) === selectedId(c.id, i, c.photos[i].id)); return photo ? [photo.image] : []; }) }))}
      selected={chapter} disabled={!workspace || busy} onSelect={setChapter} />
    <section className="story-chapter-editor" aria-label="선택한 챕터 강조 사진">
    <div className="story-chapter-editor-heading"><div><small>CHAPTER {String(chapters.findIndex(c => c.id === chapter) + 1).padStart(2, '0')}</small><h2>{currentCollection}</h2></div>
      <label>챕터 컬렉션<select aria-label="챕터 컬렉션" disabled={!workspace || busy} value={currentCollection} onChange={e => chooseCollection(e.target.value)}>{!collections.includes(currentCollection) && <option value={currentCollection}>{currentCollection} (공개 사진 없음)</option>}{collections.map(name => <option key={name}>{name}</option>)}</select></label></div>
    {workspace && candidates.length < 3 && <p role="alert">이 컬렉션에는 공개 사진이 {candidates.length}장 있습니다. 아카이브에서 최소 3장을 공개해 주세요.</p>}
    {workspace && <div className="story-edit-grid">{[0, 1, 2].map(index => {
      const photo = photos.find(p => archivePhotoId(p) === selectedIds[index]);
      const photoId = photo ? archivePhotoId(photo) : '';
      const title = photo ? photoValue(photoId, 'story', photo.title) : '';
      return <article key={`${concept.id}-${index}`}>
        <button type="button" className="story-photo-preview story-photo-open" disabled={!photo} aria-label={`강조 사진 ${index + 1} 카드 열기`} aria-haspopup="dialog" onClick={() => setDescriptionSlot(index)}>{photo ? <PreviewImage src={photo.image} alt={title}/> : <p>공개 사진을 선택해 주세요</p>}<span>강조 사진 {index + 1}</span></button>
        {photo && <p className="story-card-edit-cue"><span><RotateCw size={15} strokeWidth={1.4} aria-hidden="true" />카드 뒷면 편집</span><small>사진을 눌러보세요</small></p>}
        <div className="story-photo-choices" aria-label={`강조 사진 ${index + 1} 후보`}>{candidates.map(p => <button key={p.id} aria-label={`${p.title} 선택`} aria-pressed={p.id === photo?.id} disabled={selectedIds.includes(archivePhotoId(p)) && p.id !== photo?.id} onClick={() => update(index, archivePhotoId(p))}><PreviewImage previewWidth={320} src={p.image} alt={p.title} loading="lazy"/></button>)}</div>
        <div className="story-order" aria-label={`강조 사진 ${index + 1} 순서`}><button disabled={index === 0 || busy} onClick={() => move(index, -1)} aria-label={`강조 사진 ${index + 1} 앞으로`}>←</button><span>{index + 1} / 3</span><button disabled={index === 2 || busy} onClick={() => move(index, 1)} aria-label={`강조 사진 ${index + 1} 뒤로`}>→</button></div>
        {photo && <div className="story-card-caption"><h3>{title}</h3></div>}
      </article>;
    })}</div>}
    </section></div>
    {showActions && descriptionSlot === null && <section className="story-save-bar" aria-label="강조 사진 변경사항">
      <div className="story-save-state" role="status">
        <strong>{busy ? '저장 중…' : dirty ? '저장하지 않은 변경' : '초안 저장됨 · 공개 전'}</strong>
        <small>{!valid ? '각 챕터에서 서로 다른 공개 사진 3장을 선택해 주세요.' : '모든 챕터의 선택과 카드 설명을 함께 반영합니다.'}</small>
      </div>
      <div className="story-save-actions">
        <button disabled={busy || !dirty} onClick={() => save(false)}>초안 저장</button>
        <button className="primary" disabled={busy || !valid} onClick={() => save(true)}>강조 사진 공개 적용</button>
      </div>
    </section>}
    <CardDescriptionDialog slot={descriptionSlot}
      details={descriptionPhoto ? { image: descriptionPhoto.image, category: descriptionPhoto.category, title: descriptionTitle, location: descriptionLocation, note: descriptionNote } : null}
      onClose={() => setDescriptionSlot(null)}
      onChange={(field, value) => updatePhoto(descriptionPhotoId, field, value)} />
  </main>;
}
