import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { siteIdentity } from './content/siteIdentity';
import PrototypeTotal from './prototypes/proto-total/PrototypeTotal';
import { ContentProvider } from './content-editor/Content';
import AdminLogin from './content-editor/AdminLogin';
import { useAdminSession } from './content-editor/adminSession';
const Editor = lazy(() => import('./prototypes/admin-preview/AdminPreviewPrototype'));
const Hub = lazy(() => import('./content-editor/ContentManagementHub'));
const Archive = lazy(() => import('./content-editor/ArchiveManager'));
const Stories = lazy(() => import('./content-editor/StoryManager'));
const News = lazy(() => import('./content-editor/JournalManager'));
function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin, ready } = useAdminSession();
  const location = useLocation();
  if (!ready) return <p role="status">로그인 확인 중…</p>;
  return admin ? <Suspense fallback={<p role="status">편집 화면을 불러오는 중…</p>}>{children}</Suspense> : <Navigate to="/admin" state={{ from: location.pathname }} replace />;
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); document.title = `${siteIdentity.studioName} — ${siteIdentity.artistName}의 사진 기록`; }, [pathname]);
  return <Routes>
    <Route path="/" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
    <Route path="/prototype/total" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
    <Route path="/admin" element={<AdminLogin />} />
    <Route path="/admin/editor" element={<RequireAdmin><Editor /></RequireAdmin>} />
    <Route path="/admin/content" element={<RequireAdmin><Hub /></RequireAdmin>} />
    <Route path="/admin/content/archive" element={<RequireAdmin><Archive /></RequireAdmin>} />
    <Route path="/admin/content/archive/featured" element={<RequireAdmin><Stories /></RequireAdmin>} />
    <Route path="/admin/content/news" element={<RequireAdmin><News /></RequireAdmin>} />
    <Route path="*" element={<main><h1>페이지를 찾을 수 없습니다.</h1><Link to="/">처음으로 돌아가기</Link></main>} />
  </Routes>;
}
