import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { type CSSProperties, useEffect, useState } from "react";
import { componentPhotos } from "../component-fixture";
import SiteBrand from "../../shared/SiteBrand";
import { useSmoothWheelScroll } from "../../shared/useSmoothWheelScroll";
import "./com-d.css";
import "./com-d-marquee.css";

const selectedIndexes = [5, 7, 9];
const photos = componentPhotos.slice(0, 15);
const ribbons = [photos.slice(0, 5), photos.slice(5, 10), photos.slice(10, 15)];

export default function ComD() {
  const [settled, setSettled] = useState(false);
  useSmoothWheelScroll();
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 2600);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <main className="component-prototype com-d">
      <header>
        <SiteBrand compact />
        <span>COMPONENT STUDY / COM-D</span>
        <Link to="/">all studies ↗</Link>
      </header>
      <section className="component-hero">
        <p className="eyebrow">COM-D · THREE RIBBON BANDS</p>
        <h1>
            장면이 흐르고,
            <br />
            <em>시선이 머무는 곳.</em>
        </h1>
        <p className="description">
          세 개의 리본 위에서 모든 사진을 먼저 만납니다.
          <br />
          이후 작가의 선택이 각 장면의 온도를 남깁니다.
        </p>
      </section>
      <section className={`marquee-stage category-stage reveal-stage ${settled ? "settled" : ""}`}>
        <div className="ribbon-heading">
          <span>{settled ? "THE SELECTED THREE" : "15 MOMENTS / ONE FRAME"}</span>
          <strong>{settled ? "작가가 고른 베스트 장면" : "모든 사진을 같은 마음으로"}</strong>
        </div>
        <div className="ribbon-canvas" aria-label="세 개의 사진 리본">
          {ribbons.map((ribbon, row) => (
            <div className={`photo-ribbon ribbon-${row + 1}`} key={row}>
              {ribbon.map((photo, column) => {
                const index = row * 5 + column;
                const isSelected = selectedIndexes.includes(index);
                return (
                  <figure className={`ribbon-photo ${isSelected ? "selected" : ""}`} style={{ "--reveal-index": index, "--ribbon-index": column } as CSSProperties} key={photo.id}>
                    <img src={photo.src} alt={photo.story} />
                    <figcaption>{isSelected ? photo.story : ""}</figcaption>
                  </figure>
                );
              })}
            </div>
          ))}
        </div>
        <p className="ribbon-note" aria-live="polite">
          {settled ? "15장 중 작가가 고른 세 장면입니다." : "15장의 장면을 같은 마음으로 바라보는 중입니다."}
        </p>
      </section>
      <footer>
        <Link to="/components/c">
          <ArrowLeft size={15} /> previous
        </Link>
        <strong>카테고리 카드 흐름</strong>
        <Link to="/">back to index <ArrowRight size={15} /></Link>
      </footer>
    </main>
  );
}
