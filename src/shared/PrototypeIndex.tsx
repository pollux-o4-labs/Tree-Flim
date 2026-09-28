import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { concepts, variants } from "../content/prototype-fixture";
import { siteIdentity } from "../content/siteIdentity";
import FloatingUtilityBubble from "./FloatingUtilityBubble";
import SiteBrand from "./SiteBrand";

const componentStudies = [
  {
    id: "a",
    label: "사진 스트립",
    en: "Photo strip",
    desc: "사진이 하나의 곡선을 따라 흐르는 방식",
  },
  {
    id: "b",
    label: "스토리 프레임",
    en: "Story frames",
    desc: "사진 사이로 기억 문장이 지나가는 방식",
  },
  {
    id: "c",
    label: "드래그 루프",
    en: "Memory loop",
    desc: "드래그로 사진 흐름을 바꾸는 방식",
  },
  {
    id: "d",
    label: "카테고리 카드",
    en: "Category cards",
    desc: "카테고리 진입점이 곡선을 따라 흐르는 방식",
  },
];
export default function PrototypeIndex() {
  return (
    <div className="index-page">
      <header className="index-header">
        <SiteBrand subtitle="사진으로 건네는 마음" />
        <span className="eyebrow">PORTFOLIO STUDIES · 01—04</span>
        <span className="edition">SEPTEMBER, 2026</span>
      </header>
      <main>
        <section className="index-intro">
          <div>
            <p className="eyebrow">
              <i className="dot" /> FOUR WAYS TO REMEMBER
            </p>
            <h1>
              같은 순간,
              <br />
              <em>네 가지 시선.</em>
            </h1>
          </div>
          <div className="index-note">
            <p>
              가장 자연스러운 당신을 발견하는 일.
              <br />그 마음을 담아, 네 가지 장면을 펼쳐봅니다.
            </p>
            <span>
              마음이 머무는 이야기를 골라주세요 <ArrowDown size={15} />
            </span>
          </div>
        </section>
        <Link className="total-card" to="/prototype/total">
          <div className="total-card-copy">
            <span className="eyebrow">TOTAL · FUTURE EDITION</span>
            <h2>
              빛에 따라 바뀌는,
              <br />
              하나의 경험.
            </h2>
            <p>
              시스템 테마에 맞춰 라이트에서는 B를,
              <br />다크에서는 C를 보여주는 정식본입니다.
            </p>
            <span className="total-card-cta">
              정식본 열기 <ArrowUpRight size={17} />
            </span>
          </div>
          <div className="total-card-art" aria-hidden="true">
            <img src={concepts[1].photos[0].src} alt="" />
            <img src={concepts[2].photos[0].src} alt="" />
            <span>THE COMPLETE EXPERIENCE</span>
          </div>
        </Link>
        <div className="version-grid">
          {variants.map((v, i) => (
            <Link
              className={"version-card preview-" + v.id}
              to={"/prototype/" + v.id}
              key={v.id}
            >
              <div className="version-art">
                <span className="preview-label">
                  STUDY 0{i + 1} / {v.type}
                </span>
                <div className="preview-photos">
                  {[0, 1, 2].map((n) => (
                    <img
                      key={n}
                      src={concepts[n].photos[i].src}
                      alt=""
                      loading="lazy"
                    />
                  ))}
                </div>
                <span className="preview-word">
                  {
                    [
                      "Gather.",
                      "Little by little.",
                      "In between.",
                      "Open a story.",
                    ][i]
                  }
                </span>
                <span className="enter-circle">
                  <ArrowUpRight size={23} />
                </span>
              </div>
              <div className="version-description">
                <div>
                  <span className="eyebrow">
                    0{i + 1} — {v.en}
                  </span>
                  <h2>{v.title}</h2>
                  <p>{v.desc}</p>
                </div>
                <span className="version-letter">{v.id.toUpperCase()}</span>
              </div>
            </Link>
          ))}
        </div>
        <section className="component-studies">
          <div className="component-studies-heading">
            <div>
              <p className="eyebrow">
                <i className="dot" /> COMPONENT STUDIES
              </p>
              <h2>
                한 장면을 만드는
                <br />
                <em>작은 요소들.</em>
              </h2>
            </div>
            <p>
              랜딩 전체가 아니라, 화면을 구성할 컴포넌트 시안을 따로 비교합니다.
              <br />각 시안은 독립 폴더에서 관리됩니다.
            </p>
          </div>
          <div className="component-grid">
            {componentStudies.map((study, i) => (
              <Link
                className={`component-card component-${study.id}`}
                to={study.id === "b" ? "/components/proto-com-b" : `/components/${study.id}`}
                key={study.id}
              >
                <div className="component-card-art">
                  <span className="component-index">
                    COM-{study.id.toUpperCase()}
                  </span>
                  <div className="component-mini-art">
                    {i === 0 &&
                      [3, 7, 9].map((n) => (
                        <img key={n} src={concepts[0].photos[n].src} alt="" />
                      ))}
                    {i === 1 && (
                      <>
                        <img src={concepts[1].photos[2].src} alt="" />
                        <span>
                          가장
                          <br />
                          당신다운
                          <br />
                          순간
                        </span>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <img src={concepts[0].photos[0].src} alt="" />
                        <span>↻</span>
                      </>
                    )}
                    {i === 3 &&
                      concepts.map((c) => (
                        <img key={c.id} src={c.photos[3].src} alt="" />
                      ))}
                  </div>
                  <span className="component-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
                <div className="component-card-copy">
                  <span className="eyebrow">
                    COM-{study.id.toUpperCase()} · {study.en}
                  </span>
                  <h3>{study.label}</h3>
                  <p>{study.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <footer className="index-footer">
          <span>© {siteIdentity.artistNameLatin}. THE BEAUTY OF BEING YOURSELF.</span>
          <span>사진은 같게, 경험은 다르게.</span>
        </footer>
      </main>
      <FloatingUtilityBubble />
    </div>
  );
}
