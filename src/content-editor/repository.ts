import { emptyWorkspace, validWorkspace, type Workspace } from './model';

// Local repository boundary. Cloud persistence/auth must replace this adapter before deployment.
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tree-film-editor', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('브라우저 저장소를 열지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.'));
  });
}
export async function readWorkspace(): Promise<Workspace> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly');
    const request = tx.objectStore('workspace').get('total');
    tx.oncomplete = () => {
      db.close();
      if (request.result === undefined) resolve(emptyWorkspace());
      else if (validWorkspace(request.result)) resolve(request.result);
      else reject(new Error('저장 데이터 형식이 올바르지 않습니다. 기존 데이터는 덮어쓰지 않았습니다.'));
    };
    tx.onerror = () => { db.close(); reject(new Error('저장한 콘텐츠를 읽지 못했습니다.')); };
  });
}
export async function writeWorkspace(workspace: Workspace): Promise<Workspace> {
  if (!validWorkspace(workspace)) throw new Error('저장할 콘텐츠 형식을 확인해 주세요.');
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite');
    const store = tx.objectStore('workspace');
    let conflict = false;
    const next = { ...workspace, revision: workspace.revision + 1, savedAt: new Date().toISOString() };
    const request = store.get('total');
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== workspace.revision) { conflict = true; tx.abort(); return; }
      store.put(next, 'total');
    };
    tx.oncomplete = () => { db.close(); resolve(next); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error(conflict ? '다른 탭에서 저장한 변경이 있습니다. 현재 초안을 내보낸 뒤 새로고침해 주세요.' : '저장에 실패했습니다. 용량을 확인하거나 초안을 내보내 주세요.')); };
  });
}
