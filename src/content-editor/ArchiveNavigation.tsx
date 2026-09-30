import { Link } from 'react-router-dom';
export default function ArchiveNavigation({ featured = false }: { featured?: boolean }) {
  return <nav className="archive-content-navigation" aria-label="아카이브 관리">
    <Link to="/admin/content/archive" aria-current={!featured ? 'page' : undefined}>전체 사진 · 정보 편집</Link>
    <Link to="/admin/content/archive/featured" aria-current={featured ? 'page' : undefined}>메인 강조 사진</Link>
  </nav>;
}
