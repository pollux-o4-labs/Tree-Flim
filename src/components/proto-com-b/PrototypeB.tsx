// Independent, disposable prototype B. Edit this folder without changing the other studies.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowLeft,
  X,
  RotateCw,
  Grid2X2,
} from "lucide-react";
import {
  concepts,
  variants,
  type Photo,
} from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";
import SiteBrand from "../../shared/SiteBrand";
import { useSmoothWheelScroll } from "../../shared/useSmoothWheelScroll";
import "./prototype.css";

function makeBalancedSlots(photos: readonly Photo[]) {
  const candidates = Array.from({ length: 9 }, (_, i) => i + 3);
  let selected: number[] = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const next = shuffled
      .sort((a, b) => a - b)
      .filter(
        (slot, index, slots) =>
          index === 0 || slot - slots[index - 1] >= 3,
      );
    if (next.length >= 3) {
      selected = next.slice(0, 3);
      break;
    }
  }
  if (selected.length < 3) selected = [3, 6, 9];

  let background = 3;
  return Array.from({ length: 15 }, (_, index) => ({
    photo: selected.includes(index)
      ? photos[selected.indexOf(index)]
      : photos[background++ % photos.length],
    featured: selected.includes(index),
  }));
}

export default function PrototypeB() {
  const root = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<HTMLElement>(null);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const inquiryDialog = useRef<HTMLDialogElement>(null);
  const [slots] = useState(() =>
    concepts.map((concept) => makeBalancedSlots(concept.photos)),
  );
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [inquiry, setInquiry] = useState("");
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useSearchParams();
  const category = search.get("gallery");
  const gallery = concepts.find((c) => c.id === category);
  useSmoothWheelScroll({ disabled: Boolean(gallery) });
  function openGallery(id: string) {
    setSearch({ gallery: id });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function closeGallery() {
    setSearch({});
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goToSection(id: string) {
    setSearch({});
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
    );
  }
  function openPhoto(p: Photo) {
    setPhoto(p);
    setFlipped(false);
    photoDialog.current?.showModal();
  }
  function openInquiry(label: string) {
    setInquiry(label);
    setSent(false);
    inquiryDialog.current?.showModal();
  }
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          e.target.classList.toggle("visible", e.isIntersecting);
        }),
      { threshold: 0.12 },
    );
    root.current
      ?.querySelectorAll(".reveal")
      .forEach((el) => observer.observe(el));
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = transitionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const p = Math.max(
          0,
          Math.min(1, -rect.top / (el.offsetHeight - innerHeight || 1)),
        );
        el.style.setProperty("--progress", String(p));
      }
      root.current
        ?.querySelectorAll<HTMLElement>(".story-scene")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          const p = Math.max(
            0,
            Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)),
          );
          el.style.setProperty("--scene-progress", String(p));
        });
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, [category]);
  useEffect(() => {
    const close = () => {
      document.body.style.overflow = "";
    };
    const dialogs = [photoDialog.current, inquiryDialog.current];
    const observer = new MutationObserver(() => {
      document.body.style.overflow = dialogs.some((d) => d?.open)
        ? "hidden"
        : "";
    });
    dialogs.forEach((d) => {
      if (d)
        observer.observe(d, { attributes: true, attributeFilter: ["open"] });
    });
    return () => {
      observer.disconnect();
      close();
    };
  }, []);
  return (
    <div ref={root} className="prototype proto-com-b">
      <header className="site-header">
        <SiteBrand />
        <nav aria-label="주 메뉴">
          <a
            href="#showcase"
            onClick={
              gallery
                ? (event) => {
                    event.preventDefault();
                    goToSection("showcase");
                  }
                : undefined
            }
          >
            Work <span>작업</span>
          </a>
          <a
            href="#about"
            onClick={
              gallery
                ? (event) => {
                    event.preventDefault();
                    goToSection("about");
                  }
                : undefined
            }
          >
            About <span>소개</span>
          </a>
          <button onClick={() => openInquiry("촬영 문의")}>
            Contact <ArrowUpRight size={14} />
          </button>
        </nav>
      </header>
      {gallery ? (
        <main className="gallery-page">
          <button className="text-button" onClick={closeGallery}>
            <ArrowLeft size={17} /> 이야기로 돌아가기
          </button>
          <p className="eyebrow">THE ARCHIVE / SELECTED MOMENTS</p>
          <h1>
            {gallery.en}
            <em>{gallery.name}</em>
          </h1>
          <div className="gallery-tabs">
            {concepts.map((c) => (
              <button
                aria-pressed={c.id === category}
                key={c.id}
                onClick={() => openGallery(c.id)}
              >
                {c.name} <span>{c.photos.length}</span>
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {gallery.photos.map((p) => (
              <button key={p.id} onClick={() => openPhoto(p)}>
                <img src={p.src} alt={p.story} loading="lazy" />
                <span>
                  {p.story}
                  <ArrowUpRight size={15} />
                </span>
              </button>
            ))}
          </div>
          <p className="gallery-end">
            잠시 머물러 주셔서 감사합니다. · {gallery.photos.length}개의 기록
          </p>
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <i className="dot" /> PHOTOGRAPHY BY {siteIdentity.artistNameLatin}
              </p>
              <h1>
                우리가 지나온
                <br />
                <em>작고 다정한 날들.</em>
              </h1>
              <p>
                제가 아름답다고 느낀 순간이,
                <br />
                당신에게도 아름답기를 바랍니다.
              </p>
              <a className="hero-scroll" href="#stories">
                이야기를 따라 내려가 보세요 <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-image">
              <img
                src={concepts[0].photos[0].src}
                alt="야외에서 함께하는 두 사람의 자연스러운 웨딩 스냅"
                fetchPriority="high"
              />
              <span className="hero-handwriting">Just the way you are.</span>
              <span className="image-caption">01 / TOGETHER, AS WE ARE</span>
            </div>
            <div className="hero-bottom">
              <span>빛과 사람, 그 사이의 이야기</span>
              <span>SELECTED STORIES — 2026</span>
            </div>
          </section>
          <div id="stories">
            {concepts.map((c, ci) => (
              <section className="story-scene" key={c.id}>
                <div className="scene-heading reveal">
                  <span className="eyebrow">
                    CHAPTER 0{ci + 1} / {c.en.toUpperCase()}
                  </span>
                  <h2>
                    {c.name}
                    <span>.</span>
                  </h2>
                  <p>{c.intro}</p>
                </div>
                <div className="photo-field">
                  {slots[ci].map(({ photo: p, featured }, i) => (
                    <button
                      key={i}
                      tabIndex={featured ? 0 : -1}
                      aria-hidden={!featured}
                      className={
                        "scene-photo " +
                        (featured ? "featured reveal" : "blurred")
                      }
                      style={
                        {
                          "--slot": i,
                          "--turn": ((i * 7) % 11) - 5 + "deg",
                          "--delay": featured
                            ? slots[ci].slice(0, i).filter((s) => s.featured)
                                .length *
                                0.14 +
                              "s"
                            : "0s",
                        } as CSSProperties
                      }
                      onClick={() => featured && openPhoto(p)}
                    >
                      <img
                        src={p.src}
                        alt={featured ? p.story : ""}
                        loading="lazy"
                      />
                      {featured && (
                        <>
                          <span className="photo-story">{p.story}</span>
                          <span className="photo-open">
                            이 순간 들여다보기 ↗
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
                <div className="scene-footnote">
                  <span>0{ci + 1} — THREE MOMENTS, ONE STORY</span>
                  <span>사진에 머물면, 이야기가 보입니다.</span>
                </div>
              </section>
            ))}
          </div>
          <section
            className="transition accumulation"
            ref={transitionRef}
            id="showcase"
          >
            <div className="accumulation-heading">
              <p className="eyebrow">THERE IS ALWAYS ONE MORE STORY</p>
              <h2>
                한 장 더.
                <br />
                <em>조금 더 가까이.</em>
              </h2>
              <p>미처 들려드리지 못한 순간들을 꺼내봅니다.</p>
            </div>
            <div className="accumulation-grid">
              {concepts
                .flatMap((c) => c.photos.slice(3, 7))
                .map((p, i) => (
                  <button
                    className="reveal"
                    key={p.id}
                    onClick={() => openPhoto(p)}
                    style={{ marginTop: (i % 3) * 35 }}
                  >
                    <img src={p.src} alt={p.story} loading="lazy" />
                    <span>MEMORY / {String(i + 10).padStart(3, "0")}</span>
                  </button>
                ))}
            </div>
            <div className="accumulation-end">
              <p>이야기는 아직, 많이 남아 있습니다.</p>
              {concepts.map((c) => (
                <button key={c.id} onClick={() => openGallery(c.id)}>
                  {c.name}
                  <ArrowUpRight size={20} />
                </button>
              ))}
            </div>
          </section>
          <section className="about-section" id="about">
            <div className="about-photo reveal">
              <img
                src={concepts[2].photos[6].src}
                alt="작가의 시선으로 바라본 일상의 기록"
                loading="lazy"
              />
              <span>A NOTE FROM THE PHOTOGRAPHER</span>
            </div>
            <div className="about-copy reveal">
              <p className="eyebrow">BEHIND THE FRAME</p>
              <h2>
                당신이 당신의 모습을
                <br />
                <em>좋아하게 되는 일.</em>
              </h2>
              <p>
                잘 나오는 각도를 찾습니다.
                <br />
                억지로 만든 표정보다,
                <br />
                잠깐 방심한 순간을 좋아합니다.
              </p>
              <p>
                자신의 사진을 보고 웃는 그 순간.
                <br />
                제가 사진을 찍는 이유입니다.
              </p>
              <span className="signature">{siteIdentity.signature}</span>
            </div>
          </section>
          <section className="contact-section" id="contact">
            <p className="eyebrow">LET'S MAKE YOUR NEXT MEMORY</p>
            <h2>
              다음 장면의 주인공은,
              <br />
              <em>당신이면 좋겠습니다.</em>
            </h2>
            <div className="contact-actions">
              {["견적 확인", "일정 예약", "빠른 문의"].map((label, i) => (
                <button key={label} onClick={() => openInquiry(label)}>
                  <span>0{i + 1}</span>
                  {label}
                  <ArrowUpRight size={22} />
                </button>
              ))}
            </div>
          </section>
          <section className="journal">
            <div className="journal-heading">
              <p className="eyebrow">LIFE BETWEEN THE SHOOTS</p>
              <h2>계속되는 기록</h2>
              <span>개인 작업에서 꺼낸 세 장의 기록</span>
            </div>
            <div className="journal-grid">
              {concepts[2].photos.slice(7, 10).map((p, i) => (
                <button key={p.id} onClick={() => openPhoto(p)}>
                  <img src={p.src} alt={p.story} loading="lazy" />
                  <span>PERSONAL JOURNAL / 0{i + 1}</span>
                  <h3>
                    {
                      [
                        "산책하다, 문득",
                        "빛을 수집하는 오후",
                        "다음 계절을 기다리며",
                      ][i]
                    }{" "}
                    <ArrowUpRight size={16} />
                  </h3>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}
      <footer className="site-footer">
        <SiteBrand compact />
        <p>평범한 순간을, 오래도록.</p>
        <span>© 2026 {siteIdentity.artistNameLatin} · {siteIdentity.studioName.toUpperCase()}</span>
      </footer>
      <aside className="prototype-switcher" aria-label="프로토타입 비교">
        <Link to="/" aria-label="프로토타입 목록">
          <Grid2X2 size={16} />
        </Link>
        <span>STUDY</span>
        {variants.map((v) => (
          <Link
            key={v.id}
            to={"/prototype/" + v.id}
            aria-current={v.id === "b" ? "page" : undefined}
          >
            {v.id.toUpperCase()}
          </Link>
        ))}
        <span className="current-type">하단 누적형</span>
      </aside>
      <dialog
        ref={photoDialog}
        className="photo-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) photoDialog.current?.close();
        }}
      >
        <button
          className="dialog-close"
          onClick={() => photoDialog.current?.close()}
          aria-label="사진 닫기"
        >
          <X />
        </button>
        {photo && (
          <div className="photo-dialog-content">
            <p className="eyebrow">A MOMENT TO KEEP</p>
            <div
              className="card-perspective"
              onPointerMove={(e) => {
                if (
                  e.pointerType === "touch" ||
                  matchMedia("(prefers-reduced-motion: reduce)").matches
                )
                  return;
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--rx",
                  ((e.clientY - r.top) / r.height - 0.5) * -12 + "deg",
                );
                e.currentTarget.style.setProperty(
                  "--ry",
                  ((e.clientX - r.left) / r.width - 0.5) * 12 + "deg",
                );
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--rx", "0deg");
                e.currentTarget.style.setProperty("--ry", "0deg");
              }}
            >
              <div className={"photo-card " + (flipped ? "is-flipped" : "")}>
                <div className="card-front" aria-hidden={flipped}>
                  <img src={photo.src} alt={photo.story} />
                  <span>{photo.story}</span>
                  <small>{siteIdentity.artistNameLatin} / {photo.category}</small>
                </div>
                <div className="card-back" aria-hidden={!flipped}>
                  <p className="eyebrow">ON THE OTHER SIDE</p>
                  <h2>{photo.story}</h2>
                  <dl>
                    <dt>COLLECTION</dt>
                    <dd>{photo.category}</dd>
                    <dt>LOCATION / DATE</dt>
                    <dd>작가의 기록을 기다리는 중</dd>
                    <dt>NOTE</dt>
                    <dd>자연스러운 순간을 오래 간직하고 싶어서.</dd>
                  </dl>
                  <span className="signature">{siteIdentity.signature}</span>
                  <small>스토리와 메모는 프로토타입용 예시입니다.</small>
                </div>
              </div>
            </div>
            <button
              className="flip-button"
              onClick={() => setFlipped(!flipped)}
            >
              <RotateCw size={16} />
              {flipped ? "사진으로 돌아가기" : "뒷면의 기록 읽기"}
            </button>
          </div>
        )}
      </dialog>
      <dialog ref={inquiryDialog} className="inquiry-dialog">
        <button
          className="dialog-close"
          aria-label="문의 닫기"
          onClick={() => inquiryDialog.current?.close()}
        >
          <X />
        </button>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h2>{inquiry}</h2>
        {sent ? (
          <div role="status">
            <p>입력하신 내용을 확인했습니다.</p>
            <p>프로토타입 체험이며 실제 신청은 전송되지 않았습니다.</p>
            <button
              className="submit-button"
              onClick={() => inquiryDialog.current?.close()}
            >
              이야기로 돌아가기
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <p>어떤 순간을 남기고 싶으신가요?</p>
            <label>
              이름
              <input
                name="name"
                autoComplete="name"
                required
                placeholder="이름을 알려주세요"
              />
            </label>
            <label>
              이메일
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="답변받으실 이메일"
              />
            </label>
            <label>
              희망 촬영일
              <input name="date" type="date" required />
            </label>
            <label>
              남기고 싶은 이야기
              <textarea
                name="message"
                rows={3}
                placeholder="촬영 컨셉이나 궁금한 점을 남겨주세요."
              />
            </label>
            <small>
              화면 체험용 폼입니다. 입력 정보는 저장·전송되지 않습니다.
            </small>
            <button className="submit-button" type="submit">
              신청 흐름 체험하기 <ArrowUpRight size={18} />
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
