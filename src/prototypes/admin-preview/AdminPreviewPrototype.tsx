import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Download, ExternalLink, FileText, History, ImagePlus, Layers, Monitor, MousePointer2, PanelRightClose, Plus, Redo2, RotateCcw, Save, Search, Smartphone, Tablet, Undo2, Upload, X } from 'lucide-react';
import { concepts } from '../../content/prototype-fixture';
import { readWorkspace, writeWorkspace } from '../../content-editor/repository';
import { emptyWorkspace, safeMediaUrl, validValues, type Checkpoint, type ContentField, type Values, type Workspace } from '../../content-editor/model';
import './admin-preview.css';

const pages = [
  { name: '메인 페이지', hint: '첫 장면과 작업 소개', query: '', section: 'top' },
  { name: '작가 소개', hint: '소개 문구와 사진', query: '', section: 'about' },
  { name: '촬영 안내', hint: '문의와 안내 문구', query: '', section: 'contact' },
  { name: '포트폴리오', hint: '작품 목록과 사진', query: '&gallery=all' },
  { name: '소식 / 블로그', hint: '글과 대표 사진', query: '&news=all' },
  { name: '패키지 / 가격', hint: '촬영 상품과 상세 안내', query: '&panel=촬영 안내' },
  { name: '자주 묻는 질문', hint: '촬영 정책과 답변', query: '&panel=자주 묻는 질문' },
  { name: '시작 화면', hint: '로딩 화면과 안내 문구', query: '&intro=1' },
];
const base = import.meta.env.BASE_URL;
const appPath = (path = '') => `${base}${path.replace(/^\//, '')}`;
const timeLabel = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '아직 저장하지 않음';
type HistoryState = { current: Values; past: Values[]; future: Values[] };

export default function AdminPreviewPrototype() {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [history, setHistory] = useState<HistoryState>({ current: {}, past: [], future: [] });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, ContentField>>({});
  const [selectedId, setSelectedId] = useState('');
  const [editing, setEditing] = useState(true);
  const [width, setWidth] = useState('desktop');
  const [page, setPage] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'pages' | 'fields'>('pages');
  const [modal, setModal] = useState<'history' | 'publish' | null>(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [previewCheckpoint, setPreviewCheckpoint] = useState<Checkpoint | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusBeforeDialog = useRef<HTMLElement | null>(null);
  const selected = fields[selectedId];
  const draft = history.current;
  const dirty = JSON.stringify(draft) !== JSON.stringify(workspace.draft);
  const shownValues = previewCheckpoint?.values ?? draft;
  const editorMode = editing && !previewCheckpoint;
  const dirtyCount = Object.keys(draft).filter(id => draft[id] !== workspace.published[id]).length + Object.keys(workspace.published).filter(id => !(id in draft)).length;
  const send = useCallback((data: object) => frame.current?.contentWindow?.postMessage({ source: 'tree-film-editor', ...data }, location.origin), []);
  const sync = useCallback(() => send({ type: 'sync', values: shownValues, editing: editorMode }), [send, shownValues, editorMode]);

  useEffect(() => { let active = true; void readWorkspace().then(value => { if (active) { setWorkspace(value); setHistory({ current: value.draft, past: [], future: [] }); setLoaded(true); } }).catch(e => setError(String(e.message))); return () => { active = false; }; }, []);
  useEffect(() => { sync(); }, [sync, ready]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.source !== 'tree-film-preview') return;
      const data = event.data;
      if (data.type === 'ready') { setReady(true); sync(); send({ type: 'request-fields' }); }
      if (data.type === 'field' && typeof data.field?.id === 'string' && typeof data.field?.original === 'string') {
        const field: ContentField = data.field;
        setFields(previous => previous[field.id]?.original === field.original ? previous : { ...previous, [field.id]: field });
      }
      if (data.type === 'select' && typeof data.id === 'string') { setSelectedId(data.id); setMessage(''); }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [sync, send]);
  useEffect(() => { setImageUrl(''); }, [selectedId]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (modal) { focusBeforeDialog.current = document.activeElement as HTMLElement; dialog.current?.showModal(); }
    else { dialog.current?.close(); focusBeforeDialog.current?.focus(); }
  }, [modal]);

  function edit(next: Values) {
    if (busy || previewCheckpoint) return;
    setHistory(previous => ({ current: next, past: [...previous.past.slice(-49), previous.current], future: [] }));
    setError(''); setMessage('');
  }
  function change(value: string, id = selectedId) {
    const next = { ...draft };
    if (value === fields[id]?.original || (value === '' && !fields[id])) delete next[id];
    else next[id] = value;
    edit(next);
  }
  function undo() { if (busy || previewCheckpoint) return; setHistory(h => h.past.length ? { current: h.past[h.past.length - 1], past: h.past.slice(0, -1), future: [h.current, ...h.future] } : h); }
  function redo() { if (busy || previewCheckpoint) return; setHistory(h => h.future.length ? { current: h.future[0], past: [...h.past, h.current], future: h.future.slice(1) } : h); }
  async function persist(next: Workspace, success: string) {
    if (!loaded || busy) return false;
    setBusy(true); setError('');
    try { const saved = await writeWorkspace(next); setWorkspace(saved); setMessage(success); return true; }
    catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  const save = () => persist({ ...workspace, draft }, '초안을 저장했습니다. 방문객 화면은 바뀌지 않습니다.');
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
      if ((event.target as HTMLElement).closest('input,textarea,select')) return;
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys);
  });

  function navigate(index: number) {
    setPage(index); setSelectedId(''); setFields({}); setReady(false); setFrameKey(value => value + 1);
  }
  function select(field: ContentField) { setSelectedId(field.id); setEditing(true); send({ type: 'focus', id: field.id }); }
  async function upload(file?: File) {
    if (!file || !selected) return;
    const id = selected.id;
    const image = selected.kind === 'image';
    if (file.size > 8 * 1024 * 1024) { setError('파일은 8MB 이하로 등록해 주세요. 사진은 웹용으로 줄이면 더 빠르게 표시됩니다.'); return; }
    if (!(image ? /^image\/(jpeg|png|webp|avif|gif)$/ : /^application\/pdf$/).test(file.type)) { setError(image ? 'JPG, PNG, WebP, AVIF, GIF 이미지만 등록할 수 있습니다.' : '첨부파일은 PDF만 등록할 수 있습니다.'); return; }
    setBusy(true);
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      if (image) await new Promise<void>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(); img.onerror = () => reject(new Error('이미지를 열 수 없습니다. 파일을 확인해 주세요.')); img.src = url; });
      setHistory(previous => ({ current: { ...previous.current, [id]: url, [id + (image ? '.alt' : '.name')]: image ? file.name.replace(/\.[^.]+$/, '') : file.name }, past: [...previous.past.slice(-49), previous.current], future: [] }));
      setError(''); setMessage('파일을 등록했습니다. 초안을 저장해 주세요.');
    } catch (e) { setError(e instanceof Error ? e.message : '파일을 읽지 못했습니다.'); } finally { setBusy(false); }
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify({ schema: 1, values: draft }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tree-film-draft.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importDraft(file?: File) {
    if (!file) return;
    try { if (file.size > 50 * 1024 * 1024) throw new Error('백업 파일은 50MB 이하만 지원합니다.'); const value = JSON.parse(await file.text()); if (value.schema !== 1 || !validValues(value.values)) throw new Error('이 편집기에서 내보낸 초안 파일을 선택해 주세요.'); edit(value.values); setMessage('백업을 초안으로 불러왔습니다. 실행 취소로 이전 초안으로 돌아갈 수 있습니다.'); } catch (e) { setError((e as Error).message); }
  }
  async function checkpoint() {
    if (!checkpointName.trim()) return;
    const next: Checkpoint = { id: crypto.randomUUID(), name: checkpointName.trim(), createdAt: new Date().toISOString(), values: { ...draft } };
    if (await persist({ ...workspace, draft, checkpoints: [next, ...workspace.checkpoints] }, '체크포인트를 저장했습니다.')) setCheckpointName('');
  }
  async function restore(point: Checkpoint) {
    const backup: Checkpoint = { id: crypto.randomUUID(), name: '복원 직전 자동 백업', createdAt: new Date().toISOString(), values: { ...draft } };
    if (await persist({ ...workspace, draft: { ...point.values }, checkpoints: [backup, ...workspace.checkpoints] }, `“${point.name}” 상태를 초안으로 복원했습니다. 공개 상태는 유지됩니다.`)) {
      setHistory(h => ({ current: { ...point.values }, past: [...h.past.slice(-49), h.current], future: [] })); setPreviewCheckpoint(null); setModal(null);
    }
  }

  const fieldList = Object.values(fields).filter(field => `${field.label} ${field.section} ${field.id}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="studio">
    <header className="studio-header"><a className="studio-brand" href={appPath('admin')}><span className="studio-brand-mark">T</span><span>TREE FILM<small>콘텐츠 스튜디오</small></span></a><div className="studio-document"><span>사이트</span><ChevronRight size={13} /><strong>{pages[page].name}</strong><span className="studio-status">{!loaded ? '불러오는 중…' : busy ? '저장 중…' : dirty ? '저장하지 않은 변경' : workspace.savedAt ? '초안 저장됨' : '새 초안'}</span></div><div className="studio-actions"><button className="studio-icon" title="실행 취소" aria-label="실행 취소" disabled={!history.past.length || busy || !!previewCheckpoint} onClick={undo}><Undo2 size={17} /></button><button className="studio-icon" title="다시 실행" aria-label="다시 실행" disabled={!history.future.length || busy || !!previewCheckpoint} onClick={redo}><Redo2 size={17} /></button><button className="studio-secondary" aria-label="체크포인트" onClick={() => setModal('history')}><History size={15} /><span>체크포인트</span></button><button className="studio-secondary" aria-label="초안 저장" onClick={() => void save()} disabled={!loaded || busy || !dirty || !!previewCheckpoint}><Save size={15} /><span>초안 저장</span></button><button className="studio-primary" disabled={!loaded || busy || !!previewCheckpoint || !dirtyCount} onClick={() => setModal('publish')}>로컬 반영 <ChevronRight size={14} /></button></div></header>
    <div className="studio-environment"><span className="studio-dot" /> LOCAL WORKSPACE <span>Firebase 연결 전 · 저장과 반영은 이 브라우저에서만 동작합니다.</span><a href={appPath()} target="_blank" rel="noreferrer">방문객 화면 <ExternalLink size={12} /></a></div>
    <div className="studio-layout">
      <aside className="studio-nav" aria-label="콘텐츠 탐색"><div className="studio-nav-tabs"><button aria-pressed={tab === 'pages'} onClick={() => setTab('pages')}><Layers size={14} /> 페이지</button><button aria-pressed={tab === 'fields'} onClick={() => setTab('fields')}><FileText size={14} /> 편집 항목</button></div>{tab === 'pages' ? <nav>{pages.map((item,index) => <button key={item.name} className={page === index ? 'active' : ''} onClick={() => navigate(index)}><span className="studio-page-icon">{String(index+1).padStart(2,'0')}</span><span>{item.name}<small>{item.hint}</small></span><ChevronRight size={13} /></button>)}</nav> : <><label className="studio-search"><Search size={14} /><input aria-label="편집 항목 검색" placeholder="문구, 사진 검색" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="studio-field-list">{fieldList.map(field => <button className={selectedId === field.id ? 'active' : ''} key={field.id} onClick={() => select(field)}>{field.kind === 'image' ? <ImagePlus size={13} /> : <FileText size={13} />}<span>{field.label || '빈 문구'}<small>{field.section}</small></span>{draft[field.id] !== undefined && <i />}</button>)}{!fieldList.length && <p>이 페이지에서 찾은 항목이 없습니다.</p>}</div></>}
        <div className="studio-nav-bottom"><span>초안 백업</span><button onClick={exportDraft}><Download size={14} /> 파일로 내보내기</button><label><Upload size={14} /> 백업 불러오기<input type="file" accept="application/json,.json" disabled={busy || !!previewCheckpoint} onChange={e => { void importDraft(e.target.files?.[0]); e.target.value = ''; }} /></label><small>마지막 저장<br />{timeLabel(workspace.savedAt)}</small></div></aside>
      <section className="studio-canvas" aria-label="실제 사이트 미리보기"><div className="studio-toolbar"><select className="studio-mobile-pages" aria-label="편집할 페이지" value={page} onChange={e => navigate(Number(e.target.value))}>{pages.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}</select><div className="studio-mode"><button aria-pressed={editorMode} disabled={!!previewCheckpoint} onClick={() => setEditing(true)}><MousePointer2 size={14} /> 선택 편집</button><button aria-pressed={!editorMode} onClick={() => setEditing(false)}>둘러보기</button></div><span className="studio-preview-url">/</span><div className="studio-devices">{[['desktop',Monitor,'데스크톱'],['tablet',Tablet,'태블릿'],['mobile',Smartphone,'모바일']].map(([key,Icon,label]) => { const Device = Icon as typeof Monitor; return <button key={String(key)} aria-label={`${label} 미리보기`} aria-pressed={width === key} onClick={() => setWidth(String(key))}><Device size={16} /></button>; })}</div></div>
        {previewCheckpoint ? <div className="studio-preview-banner"><span>“{previewCheckpoint.name}” 미리보기 · 읽기 전용</span><button onClick={() => setModal('history')}>복원하기</button><button onClick={() => setPreviewCheckpoint(null)}>현재 초안으로 돌아가기</button></div> : <p className="studio-hint"><span className="studio-dot" />{editing ? '바꾸고 싶은 문구나 사진을 클릭하세요. 메뉴 이동은 둘러보기에서 할 수 있어요.' : '사이트를 둘러보며 상세창을 연 다음, 선택 편집으로 전환하세요.'}</p>}
        <div className={`studio-stage ${width}`}><div className="studio-frame-shell">{!ready && <div className="studio-frame-loading">페이지를 준비하고 있습니다…</div>}<iframe key={frameKey} ref={frame} title="TREE FILM 편집 미리보기" src={`${appPath()}?editor=1${pages[page].query}`} onLoad={() => { sync(); send({ type: 'request-fields' }); if (pages[page].section) send({ type: 'jump', id: pages[page].section }); }} /></div></div><div className="studio-canvas-footer"><span><Check size={12} /> {ready ? '실제 페이지와 연결됨' : '페이지 연결 중…'}</span><span>{width === 'mobile' ? '390px' : width === 'tablet' ? '768px' : '화면 너비에 맞춤'} · {Object.keys(fields).length}개 편집 항목</span></div></section>
      <aside className="studio-inspector" aria-label="선택 항목 편집"><div className="studio-inspector-top"><span>속성 편집</span><button className="studio-icon" aria-label="선택 해제" onClick={() => setSelectedId('')}><PanelRightClose size={16} /></button></div><select className="studio-mobile-field" aria-label="편집할 항목" value={selectedId} onChange={e => { const field = fields[e.target.value]; if (field) select(field); }}><option value="">화면에서 선택하거나 항목 찾기</option>{Object.values(fields).map(field => <option key={field.id} value={field.id}>{field.section} · {field.label}</option>)}</select>{selected ? <div className="studio-inspector-body"><div className="studio-field-type">{selected.kind === 'text' ? 'TEXT' : selected.kind === 'image' ? 'IMAGE' : 'ATTACHMENT'}<span>{selected.section}</span></div><h1>{selected.kind === 'image' ? '사진' : selected.kind === 'attachment' ? '첨부파일' : selected.label || '문구'}</h1><fieldset disabled={busy || !!previewCheckpoint || !loaded}>
        {selected.kind === 'text' ? <label className="studio-field">내용<textarea aria-label="선택한 문구" value={shownValues[selectedId] ?? selected.original} rows={7} onChange={e => change(e.target.value)} /><span className="studio-field-note">{(shownValues[selectedId] ?? selected.original).length}자 · 줄바꿈을 포함해 바로 반영됩니다</span></label> : <>
          {selected.kind === 'image' && <div className="studio-image-preview"><img src={shownValues[selectedId] ?? selected.original} alt="선택한 이미지 미리보기" /></div>}
          <label className="studio-upload"><Upload size={19} /><strong>{selected.kind === 'image' ? '새 이미지 업로드' : 'PDF 첨부'}</strong><span>{selected.kind === 'image' ? 'JPG · PNG · WebP · AVIF · GIF' : 'PDF 문서'} · 최대 8MB</span><input aria-label={selected.kind === 'image' ? '이미지 파일 선택' : '첨부파일 선택'} type="file" accept={selected.kind === 'image' ? 'image/jpeg,image/png,image/webp,image/avif,image/gif' : 'application/pdf'} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
          <label className="studio-field">{selected.kind === 'image' ? '또는 이미지 주소' : '또는 문서 주소'}<input type="url" aria-label="미디어 주소" placeholder="https://…" value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></label><button className="studio-secondary studio-full" disabled={!imageUrl.trim()} onClick={() => { if (!safeMediaUrl(imageUrl.trim(), selected.kind === 'image')) setError('HTTPS 주소를 입력해 주세요.'); else if (/drive\.google\.com/.test(imageUrl)) setError('Drive 공유 페이지는 직접 이미지 주소가 아닙니다. 파일 업로드 또는 직접 이미지 주소를 사용해 주세요. Drive 폴더 연동은 아직 연결되지 않았습니다.'); else { change(imageUrl.trim()); setImageUrl(''); } }}>주소 적용</button>
          <label className="studio-field">{selected.kind === 'image' ? '대체 텍스트' : '첨부 이름'}<input aria-label={selected.kind === 'image' ? '대체 텍스트' : '첨부 이름'} value={shownValues[selectedId + (selected.kind === 'image' ? '.alt' : '.name')] ?? selected.alt ?? ''} onChange={e => change(e.target.value, selectedId + (selected.kind === 'image' ? '.alt' : '.name'))} /><span className="studio-field-note">{selected.kind === 'image' ? '사진을 볼 수 없는 방문객에게 내용을 설명합니다.' : '방문객에게 표시할 이름입니다.'}</span></label>
          {selected.kind === 'image' && <details className="studio-library"><summary>기존 사진에서 고르기</summary><div>{concepts.flatMap(c => c.photos).map(photo => <button aria-label={`사진 ${photo.id} 선택`} key={photo.id} onClick={() => change(photo.src)}><img src={photo.src} alt={photo.story} loading="lazy" /></button>)}</div></details>}
        </>}
        <button className="studio-reset" disabled={draft[selectedId] === undefined} onClick={() => { const next = { ...draft }; delete next[selectedId]; delete next[selectedId + '.alt']; delete next[selectedId + '.name']; edit(next); }}><RotateCcw size={13} /> 기본 콘텐츠로 되돌리기</button></fieldset><div className="studio-field-meta"><span>편집 안내</span><p>연결된 다른 화면에도 함께 반영됩니다. 초안을 저장해도 방문객 화면은 바뀌지 않습니다.</p></div></div> : <div className="studio-empty"><div><MousePointer2 size={27} /></div><h1>보이는 곳에서,<br />바로 편집하세요.</h1><p>화면의 문구나 사진을 선택하면<br />여기에 편집할 내용이 나타납니다.</p><hr /><span>01 <b>화면에서 선택</b></span><span>02 <b>내용 수정 · 미리보기</b></span><span>03 <b>초안 저장 · 체크포인트</b></span></div>}<div className="studio-inspector-footer"><span className="studio-dot" /> {dirtyCount}개 변경 · 공개 반영 전</div></aside>
    </div>
    {(error || message) && <div className={`studio-toast${error ? ' error' : ''}`} role={error ? 'alert' : 'status'}><span>{error || message}</span><button aria-label="알림 닫기" onClick={() => { setError(''); setMessage(''); }}><X size={15} /></button></div>}
    <dialog className="studio-dialog" ref={dialog} onCancel={() => { setModal(null); }}><div className="studio-dialog-heading"><div><span>CONTENT HISTORY</span><h2>{modal === 'publish' ? '이 브라우저의 방문객 화면에 반영' : '체크포인트'}</h2></div><button className="studio-icon" aria-label="창 닫기" onClick={() => setModal(null)}><X size={20} /></button></div>{modal === 'publish' ? <><p>현재 초안을 같은 브라우저의 /prototype/total에 반영합니다. 다른 기기나 실제 배포 사이트에는 적용되지 않습니다.</p><p>반영 직전 공개 상태를 체크포인트로 자동 보관합니다.</p><button className="studio-primary" disabled={busy} onClick={async () => { const backup = { id: crypto.randomUUID(), name: '반영 전 공개 상태', createdAt: new Date().toISOString(), values: { ...workspace.published } }; if (await persist({ ...workspace, draft, published: { ...draft }, checkpoints: [backup, ...workspace.checkpoints] }, '이 브라우저의 방문객 화면에 반영했습니다.')) setModal(null); }}>로컬 반영 확인</button></> : <><p>이름을 붙여 현재 상태를 보관하고, 이전 상태를 미리 본 뒤 초안으로 복원하세요.</p><div className="studio-checkpoint-form"><input aria-label="체크포인트 이름" maxLength={80} value={checkpointName} placeholder="예: 가을 이벤트 시작 전" onChange={e => setCheckpointName(e.target.value)} /><button className="studio-primary" disabled={!checkpointName.trim() || busy || !loaded || !!previewCheckpoint} onClick={() => void checkpoint()}><Plus size={15} /> 저장</button></div><div className="studio-checkpoints">{workspace.checkpoints.map(point => <article key={point.id}><History size={18} /><div><h3>{point.name}</h3><p>{timeLabel(point.createdAt)} · {Object.keys(point.values).length}개 사용자 지정 항목</p></div><button className="studio-secondary" onClick={() => { setPreviewCheckpoint(point); setModal(null); }}>미리보기</button><button className="studio-secondary" disabled={busy} onClick={() => void restore(point)}>복원</button></article>)}{!workspace.checkpoints.length && <div className="studio-checkpoints-empty"><History size={30} /><p>아직 저장된 체크포인트가 없습니다.</p></div>}</div></>}</dialog>
  </main>;
}
