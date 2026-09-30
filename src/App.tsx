import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { siteIdentity } from './content/siteIdentity';
import PrototypeTotal from './prototypes/proto-total/PrototypeTotal';
import { lazy, Suspense } from 'react';
const ContentStudio = import.meta.env.DEV ? lazy(() => import('./prototypes/admin-preview/AdminPreviewPrototype')) : null;
import { ContentProvider } from './content-editor/Content';

/** The local studio is a prototype, not an authenticated production CMS. */
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${siteIdentity.studioName} — ${siteIdentity.artistName}의 사진 기록`;
  }, [pathname]);
  return <Routes>
    <Route path="/" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
    <Route path="/admin/*" element={ContentStudio ? <Suspense fallback={<p>불러오는 중…</p>}><ContentStudio /></Suspense> : <main><h1>관리자 기능 준비 중</h1><p>운영 인증 연결 후 사용할 수 있습니다.</p></main>} />
    <Route path="*" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
  </Routes>;
}
