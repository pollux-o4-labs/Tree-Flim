import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileText, FolderOpen } from "lucide-react";
import "./content-management-hub.css";
import "./content-management-hub-enhancements.css";

export default function ContentManagementHub() {
  return (
    <main className="content-management-hub">
      <header>
        <a
          href={import.meta.env.BASE_URL + 'admin/editor'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="화면 편집 새 창에서 열기"
        >
          <ArrowLeft size={17} /> 화면 편집
        </a>
        <span>사이트 관리</span>
        <a
          className="content-management-visitor"
          href={import.meta.env.BASE_URL + 'prototype/total'}
          target="_blank"
          rel="noreferrer"
        >
          방문객 화면 <ArrowUpRight size={14} />
        </a>
      </header>
      <section aria-labelledby="content-management-title">
        <p>SITE CONTENT</p>
        <h1 id="content-management-title">사이트 관리</h1>
        <span>
          작품 사진은 아카이브에서, 뉴스와 행사는 소식에서 관리하세요.
        </span>
        <div className="content-management-grid">

          <Link to="/admin/content/archive" className="featured">
            <FolderOpen size={24} />
            <i>사진과 카테고리</i>
            <strong>아카이브</strong>
            <small>
              사진 등록, 카드 정보 편집과 메인 강조 사진 선택을 관리합니다.
            </small>
            <b>
              아카이브 열기 <ArrowUpRight size={14} />
            </b>
          </Link>
          <Link to="/admin/content/news">
            <FileText size={24} />
            <i>뉴스와 행사</i>
            <strong>소식</strong>
            <small>
              뉴스와 행사를 작성하고 예정·진행 중·종료 상태를 바꿉니다.
            </small>
            <b>
              소식 열기 <ArrowUpRight size={14} />
            </b>
          </Link>
        </div>
      </section>
    </main>
  );
}
