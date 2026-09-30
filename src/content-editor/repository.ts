import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
import { hasAdminSession } from './adminSession';
import { reconcileArchiveContent } from './archiveContent';
import { emptyWorkspace, validWorkspace, type Workspace } from './model';

let cachedWorkspace: Workspace | null = null;
let pendingRead: Promise<Workspace> | null = null;
let cacheGeneration = 0;
export function getCachedWorkspace() { return cachedWorkspace; }
function invalidateCache() { cachedWorkspace = null; pendingRead = null; cacheGeneration++; }
if (typeof window !== 'undefined') window.addEventListener('focus', invalidateCache);

export const WORKSPACE_UPDATED = 'tree-film-workspace-updated';
const workspaceChannel = typeof window === 'undefined' || typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(WORKSPACE_UPDATED);
workspaceChannel?.addEventListener('message', () => { invalidateCache(); window.dispatchEvent(new Event(WORKSPACE_UPDATED)); });

const privateRef = doc(db, 'sites/treefilm/drafts/workspace');
const publicRef = doc(db, 'sites/treefilm/public/workspace');
window.addEventListener('tree-film-auth-updated', () => { invalidateCache(); window.dispatchEvent(new Event(WORKSPACE_UPDATED)); });
async function readStoredWorkspace(): Promise<Workspace> {
  await auth.authStateReady();
  // UI is not the security boundary: Firestore separately enforces the admin claim.
  const token = auth.currentUser ? await auth.currentUser.getIdTokenResult() : null;
  const snapshot = await getDoc(token?.claims.admin === true ? privateRef : publicRef);
  if (!snapshot.exists()) return reconcileArchiveContent(emptyWorkspace());
  const data = snapshot.data();
  const workspace = token?.claims.admin === true ? data : { ...emptyWorkspace(), ...data, draft: data.published ?? {} };
  if (!validWorkspace(workspace)) throw new Error('저장 데이터 형식이 올바르지 않습니다.');
  return reconcileArchiveContent(workspace);
}
export function readWorkspace(): Promise<Workspace> {
  if (cachedWorkspace) return Promise.resolve(cachedWorkspace);
  if (pendingRead) return pendingRead;
  const generation = cacheGeneration;
  const request = readStoredWorkspace().then(workspace => {
    if (generation === cacheGeneration) cachedWorkspace = workspace;
    return workspace;
  }).finally(() => { if (pendingRead === request) pendingRead = null; });
  pendingRead = request;
  return request;
}

export async function writeWorkspace(workspace: Workspace): Promise<Workspace> {
  if (!validWorkspace(workspace)) throw new Error('저장할 콘텐츠 형식을 확인해 주세요.');
  if (!hasAdminSession()) throw new Error('관리자 로그인이 필요합니다.');
  const serialized = JSON.stringify(workspace);
  if (serialized.includes('data:image/')) throw new Error('이미지는 파일 대신 공개 이미지 URL로 등록해 주세요.');
  if (new TextEncoder().encode(serialized).length > 850_000) throw new Error('콘텐츠가 저장 한도를 초과했습니다. 체크포인트나 긴 내용을 정리해 주세요.');
  const next = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(privateRef);
    const stored = snapshot.exists() ? snapshot.data() as Workspace : emptyWorkspace();
    if (stored.revision !== workspace.revision) throw new Error('다른 곳에서 저장한 변경이 있습니다. 초안을 내보낸 뒤 새로고침해 주세요.');
    const next = reconcileArchiveContent({ ...workspace, revision: workspace.revision + 1, savedAt: new Date().toISOString() }, reconcileArchiveContent(stored));
    const publicData = {
      schema: 1, revision: next.revision, savedAt: next.savedAt, published: next.published,
      archivePublished: (next.archivePublished ?? []).filter(record => record.status === 'published'),
      ...(next.newsPublished !== undefined ? { newsPublished: next.newsPublished.filter(record => record.status === 'published') } : {}),
      archiveCategories: [...new Set((next.archivePublished ?? []).filter(record => record.status === 'published').map(record => record.category))],
    };
    transaction.set(privateRef, next);
    transaction.set(publicRef, publicData);
    return next;
  });
  cacheGeneration++; cachedWorkspace = next; pendingRead = null;
  window.dispatchEvent(new Event(WORKSPACE_UPDATED));
  workspaceChannel?.postMessage(next.revision);
  return next;
}
