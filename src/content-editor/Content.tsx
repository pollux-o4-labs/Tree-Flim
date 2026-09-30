import PreviewImage from '../shared/PreviewImage';
import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ImgHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { readWorkspace, WORKSPACE_UPDATED } from './repository';
import { safeMediaUrl, validValues, type ContentField, type Values } from './model';
import './content.css';

type Context = { ready: boolean; values: Values; preview: boolean; editing: boolean; register: (field: ContentField) => void };
const ContentContext = createContext<Context | null>(null);
export function useContentReady() {
  return useContext(ContentContext)?.ready ?? true;
}
export function useContentEditing() {
  const context = useContext(ContentContext);
  return Boolean(context?.preview && context.editing);
}
export function useContentValue() {
  const context = useContext(ContentContext);
  return (id: string, fallback: string) => context?.values[id] ?? fallback;
}
export function ContentProvider({ children }: { children: ReactNode }) {
  const [preview] = useState(() => window.parent !== window && new URLSearchParams(location.search).has('editor'));
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Values>({});
  const fields = useRef(new Map<string, ContentField>());
  const [editing, setEditing] = useState(true);
  const send = (message: object) => window.parent.postMessage({ source: 'tree-film-preview', ...message }, location.origin);
  const context = useMemo<Context>(() => ({ ready, values, preview, editing, register(field) {
    const before = fields.current.get(field.id);
    if (JSON.stringify(before) === JSON.stringify(field)) return;
    fields.current.set(field.id, field);
    if (preview) send({ type: 'field', field });
  } }), [ready, values, preview, editing]);
  useEffect(() => {
    if (!preview) {
      let active = true;
      const refresh = () => { void readWorkspace().then(w => { if (active) { setValues(w.published); setReady(true); } }).catch(() => { if (active) setReady(true); }); };
      refresh();
      window.addEventListener(WORKSPACE_UPDATED, refresh);
      window.addEventListener('focus', refresh);
      return () => { active = false; window.removeEventListener(WORKSPACE_UPDATED, refresh); window.removeEventListener('focus', refresh); };
    }
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.source !== 'tree-film-editor') return;
      const data = event.data;
      if (data.type === 'sync' && validValues(data.values)) { setValues(data.values); setReady(true); setEditing(data.editing === true); }
      if (data.type === 'request-fields') fields.current.forEach(field => send({ type: 'field', field }));
      if (data.type === 'focus' && typeof data.id === 'string') {
        const node = Array.from(document.querySelectorAll<HTMLElement>(`[data-content-id="${CSS.escape(data.id)}"]`))
          .find(element => !element.closest('[hidden], dialog:not([open])'));
        node?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
      if (data.type === 'jump' && typeof data.id === 'string') {
        if (data.id === 'top') window.scrollTo({ top: 0, behavior: 'instant' });
        else document.getElementById(data.id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    };
    window.addEventListener('message', receive);
    send({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, [preview]);
  useEffect(() => {
    if (!preview) return;
    document.documentElement.dataset.contentEditing = String(editing);
    const select = (event: MouseEvent) => {
      if (!editing) return;
      const node = (event.target as Element)?.closest<HTMLElement>('[data-content-id]');
      if (!node) return;
      event.preventDefault(); event.stopImmediatePropagation();
      document.querySelectorAll('[data-content-selected]').forEach(el => el.removeAttribute('data-content-selected'));
      node.dataset.contentSelected = 'true';
      send({ type: 'select', id: node.dataset.contentId });
    };
    document.addEventListener('click', select, true);
    return () => { document.removeEventListener('click', select, true); delete document.documentElement.dataset.contentEditing; };
  }, [editing, preview]);
  return <ContentContext.Provider value={context}>{children}</ContentContext.Provider>;
}

function useField(field: ContentField) {
  const context = useContext(ContentContext);
  const register = context?.register;
  useEffect(() => { register?.(field); }, [register, field.id, field.kind, field.label, field.original, field.section, field.alt]);
  return { value: context?.values[field.id] ?? field.original, context };
}

export function Text({ id, children, section = '페이지 문구', label }: { id: string; children: ReactNode; section?: string; label?: string }) {
  const original = children == null ? '' : String(children);
  const { value, context } = useField({ id, kind: 'text', original, section, label: label ?? original.trim().slice(0, 50) });
  if (!context) return <>{children}</>;
  return context.preview ? createElement('content-text', { className: 'content-text', 'data-content-id': id, 'data-content-empty': value.trim() ? undefined : 'true' }, value) : <>{value}</>;
}

export function ContentImage({ field, section = '사진', ...props }: ImgHTMLAttributes<HTMLImageElement> & { field: string; section?: string; previewWidth?: number | null }) {
  const { value, context } = useField({ id: field, kind: 'image', original: props.src ?? '', label: props.alt || '사진', section, alt: props.alt ?? '' });
  const src = safeMediaUrl(value, true) ? value : props.src;
  return <PreviewImage {...props} src={context ? src : props.src} alt={context?.values[field + '.alt'] ?? props.alt} data-content-id={context?.preview ? field : undefined} />;
}

export function ContentTextarea({ field, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { field: string }) {
  const { value, context } = useField({ id: field, kind: 'text', original: props.placeholder ?? '', label: '문의 입력 안내 문구', section: '문의' });
  return <textarea {...props} placeholder={value} data-content-id={context?.preview ? field : undefined} />;
}

export function Attachment({ id, section = '첨부파일' }: { id: string; section?: string }) {
  const { value, context } = useField({ id, kind: 'attachment', original: '', label: '첨부파일', section });
  if (!context || (!value && !context.preview)) return null;
  const valid = safeMediaUrl(value);
  return <a className="content-attachment" data-content-id={context.preview ? id : undefined} href={value && valid ? value : undefined} target="_blank" rel="noreferrer" download={value.startsWith('data:') ? (context.values[id + '.name'] || 'document.pdf') : undefined}>{context.values[id + '.name'] || (value ? '첨부파일 보기 ↗' : '+ 첨부파일 등록')}</a>;
}
