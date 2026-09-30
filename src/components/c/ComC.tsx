import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { type CSSProperties, useEffect, useState } from "react";
import { componentPhotos } from "../component-fixture";
import SiteBrand from "../../shared/SiteBrand";
import { useSmoothWheelScroll } from "../../shared/useSmoothWheelScroll";
import "./com-c.css";
import "./com-c-marquee.css";

const selectedIndexes = [5, 7, 9];
const photos = componentPhotos.slice(0, 15);

const waveOffsets = [
  [-7, 7, -4, 6, -6],
  [5, -6, 7, -5, 5],
  [-5, 6, -7, 5, -4],
];

export default function ComC() {
  const [settled, setSettled] = useState(false);
  useSmoothWheelScroll();

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="component-prototype com-c">
      <header>
        <SiteBrand compact />
        <span>COMPONENT STUDY / COM-C</span>
        <Link to="/">all studies ↗</Link>
      </header>
      <section className="component-hero">
        <p className="eyebrow">COM-C · ASYMMETRIC S-WAVE CANVAS</p>
        <h1>
            모든 장면을 먼저,
            <br />
            <em>가장 좋은 세 장면을 나중에.</em>
        </h1>
        <p className="description">
          같은 크기의 사진들이 한 화면에 함께 놓입니다.
          <br />
          시간이 지나면 작가가 고른 장면만 천천히 선명해집니다.
        </p>
      </section>
      <section className={`photo-card-stage reveal-stage ${settled ? "settled" : ""}`}>
        <div className="wave-heading">
          <span>{settled ? "THE PHOTOGRAPHER'S EDIT" : "ALL MOMENTS, FIRST"}</span>
          <strong>{settled ? "작가가 고른 베스트 장면" : "모든 장면을 바라보는 중"}</strong>
        </div>
        <div className="wave-canvas" aria-label="15장의 사진 흐름">
          {photos.map((photo, index) => (
            <figure
              className={`wave-photo ${selectedIndexes.includes(index) ? "selected" : ""}`}
              style={{
                "--reveal-index": index,
                "--wave-x": `${waveOffsets[Math.floor(index / 5)][index % 5]}%`,
                "--wave-y": `${index % 2 ? 5 : -4}px`,
              } as CSSProperties}
              key={photo.id}
            >
              <img src={photo.src} alt={photo.story} />
              <figcaption>{selectedIndexes.includes(index) ? photo.story : ""}</figcaption>
            </figure>
          ))}
        </div>
        <p className="wave-note" aria-live="polite">
          {settled ? "작가의 시선이 머문 세 장면을 확인해 보세요." : "사진이 한 화면에 모이고 있습니다."}
        </p>
      </section>
      <footer>
        <Link to="/components/proto-com-b">
          <ArrowLeft size={15} /> previous
        </Link>
        <strong>앞·뒤 포토카드</strong>
        <Link to="/components/d">
          next <ArrowRight size={15} />
        </Link>
      </footer>
    </main>
  );
}
