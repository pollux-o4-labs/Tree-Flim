import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { siteIdentity } from './content/siteIdentity';
import PrototypeTotal from './prototypes/proto-total/PrototypeTotal';
import ContentStudio from './prototypes/admin-preview/AdminPreviewPrototype';
import { ContentProvider } from './content-editor/Content';

/** The deployed product has only two public routes: the site and its secured studio. */
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${siteIdentity.studioName} — ${siteIdentity.artistName}의 사진 기록`;
  }, [pathname]);
  return <Routes>
    <Route path="/" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
    <Route path="/admin" element={<ContentStudio />} />
    <Route path="*" element={<ContentProvider><PrototypeTotal /></ContentProvider>} />
  </Routes>;
}
