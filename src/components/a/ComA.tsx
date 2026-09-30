import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { concepts, makeSlots } from "../../content/prototype-fixture";
import SiteBrand from "../../shared/SiteBrand";
import { useSmoothWheelScroll } from "../../shared/useSmoothWheelScroll";
import "./com-a.css";

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function useShowcaseProgress(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scene = root.current;
    if (!scene) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("visible", entry.isIntersecting)),
      { threshold: 0.12 },
    );
    scene.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    const offsets = new Map<HTMLElement, { current: number; target: number }>();
    let frame = 0;
    let motionFrame = 0;
    let previous = 0;
    const moveTowards = (current: number, target: number, distance: number) => {
      if (Math.abs(target - current) <= distance) return target;
      return current + Math.sign(target - current) * distance;
    };
    const animate = (now: number) => {
      const delta = Math.min(50, previous ? now - previous : 16) / 1000;
      previous = now;
      let moving = false;
      offsets.forEach((state, element) => {
        state.current = moveTowards(state.current, state.target, 130 * delta);
        element.style.setProperty("--scene-translate-y", `${state.current}px`);
        moving ||= state.current !== state.target;
      });
      motionFrame = moving ? requestAnimationFrame(animate) : 0;
      if (!moving) previous = 0;
    };
    const update = () => {
      frame = 0;
      const field = scene.querySelector<HTMLElement>(".photo-field");
      if (!field) return;
      const fieldRect = field.getBoundingClientRect();
      const fieldCenter = fieldRect.top + fieldRect.height / 2;
      const progress = clamp(
        (innerHeight * 0.82 - fieldCenter) /
          (innerHeight * 0.82 - innerHeight * 0.48),
      );
      scene.style.setProperty("--scene-progress", String(progress));
      scene.querySelectorAll<HTMLElement>(".scene-photo").forEach((photo) => {
        const movementScale = photo.classList.contains("featured") ? 0.8 : 1;
        const target = (0.5 - progress) * 130 * movementScale;
        const state = offsets.get(photo) ?? { current: target, target };
        state.target = target;
        offsets.set(photo, state);
        photo.style.setProperty("--scene-translate-y", `${state.current}px`);
      });
      if (!motionFrame) motionFrame = requestAnimationFrame(animate);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      offsets.clear();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(motionFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root]);
}

function ShowcaseScene({ slots }: { slots: ReturnType<typeof makeSlots> }) {
  const root = useRef<HTMLElement>(null);
  useShowcaseProgress(root);
  return (
    <section ref={root} className="showcase-scene original">
      <div className="showcase-label">
        <span>원본</span>
        <strong>선택 카드가 블러 카드 이동량의 70%</strong>
      </div>
      <div className="scene-heading reveal">
        <span className="eyebrow">CHAPTER 01 / TOGETHER</span>
        <h2>{concepts[0].name}<span>.</span></h2>
        <p>{concepts[0].intro}</p>
      </div>
      <div className="photo-field">
        {slots.map(({ photo: p, featured }, i) => (
          <button
            key={p.id}
            tabIndex={featured ? 0 : -1}
            aria-hidden={!featured}
            className={`scene-photo ${featured ? "featured reveal" : "blurred"}`}
            style={{ "--slot": i, "--turn": `${((i * 7) % 11) - 5}deg`, "--delay": "0s" } as CSSProperties}
          >
            <img src={p.src} alt={featured ? p.story : ""} loading="lazy" />
            {featured && (
              <>
                <span className="photo-story">{p.story}</span>
                <span className="photo-open">이 순간 들여다보기 ↗</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="scene-footnote"><span>01 — THREE MOMENTS, ONE STORY</span><span>사진에 머물면, 이야기가 보입니다.</span></div>
    </section>
  );
}

const affordanceVariants = [
  { id: "film", name: "Contact sheet", title: "필름의 여백 · 원본", description: "선택한 원본 그대로. 필름 가장자리의 작은 표식과 프레임 번호로 한 컷을 골라 확대하는 경험.", stock: "PORTRA 400", category: "ORIGINAL" },
] as const;

function AffordanceComparison({ slots }: { slots: ReturnType<typeof makeSlots> }) {
  const samples = slots.filter((slot) => slot.featured).slice(0, 3);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const openPhoto = (index: number) => { setSelected(index); dialog.current?.showModal(); };
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const observer = new MutationObserver(() => {
      document.body.style.overflow = modal.open ? "hidden" : "";
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["open"] });
    return () => { observer.disconnect(); document.body.style.overflow = ""; };
  }, []);
  return (
    <section className="affordance-comparison" id="touch-studies">
      <div className="affordance-heading">
        <span className="eyebrow">THE FILM EDIT / 04 TOUCH STUDIES</span>
        <h2>가까이 보고 싶은,<br /><em>작은 손짓.</em></h2>
        <p>어두운 배경과 3열의 작은 사진 사이에서, 선명한 세 장을 눌러보세요.</p>
      </div>
      <div className="affordance-grid">
        {affordanceVariants.map((variant, index) => (
          <article className={`affordance-stage affordance-film affordance-${variant.id}`} key={variant.id}>
            <div className="affordance-stage-label"><span>{String(index + 1).padStart(2, "0")} / {variant.category}</span><strong>{variant.title}</strong></div>
            <div className="affordance-scene-intro"><span>CHAPTER 01 / TOGETHER</span><h4>함께라는 순간.</h4><p>두 사람 사이, 말보다 먼저 닿는 마음.</p></div>
            <div className="affordance-photo-group">
              {Array.from({ length: 9 }, (_, cellIndex) => {
                const photoIndex = [2, 4, 6].indexOf(cellIndex);
                const turn = [-5, 2, -3, 4, -2, 3, 4, -3, 2][cellIndex];
                if (photoIndex < 0) return <div className="affordance-background-photo" key={cellIndex} aria-hidden="true" style={{ "--card-turn": `${turn}deg` } as CSSProperties}><img src={slots[cellIndex % slots.length].photo.src} alt="" loading="lazy" /></div>;
                const sample = samples[photoIndex];
                return (
                <div className="affordance-featured-photo" key={cellIndex} style={{ "--card-turn": `${turn}deg` } as CSSProperties}>
                <button className="affordance-card" type="button" key={sample.photo.id} aria-label={`${variant.title}: ${sample.photo.story} 크게 보기`} onClick={() => openPhoto(photoIndex)}>
                  <img src={sample.photo.src} alt={sample.photo.story} loading="lazy" />
                  <span className="art-mark" aria-hidden="true" />
                  <span className="affordance-cue" aria-hidden="true">↗</span>
                  <span className="film-number" aria-hidden="true">{variant.stock} · 0{photoIndex + 1}</span>
                </button>
                <span className="affordance-story">{sample.photo.story}</span>
                </div>
              ); })}
            </div>
            <p className="affordance-scene-hint">선명한 사진을 터치해 들여다보세요 ↗</p>
            <h3>{variant.name}</h3><p>{variant.description}</p>
          </article>
        ))}
      </div>
      <div className="affordance-endnote"><span>EVERY MOMENT DESERVES A CLOSER LOOK.</span><span>1 film study · 3 moments</span></div>
      <dialog ref={dialog} className="affordance-lightbox" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowRight") setSelected((selected + 1) % samples.length); if (event.key === "ArrowLeft") setSelected((selected + samples.length - 1) % samples.length); }} aria-label="사진 크게 보기">
        <button className="lightbox-close" type="button" onClick={() => dialog.current?.close()} aria-label="사진 닫기">닫기 ×</button>
        <img src={samples[selected]?.photo.src} alt={samples[selected]?.photo.story} />
        <div className="lightbox-caption"><button type="button" aria-label="이전 사진" onClick={() => setSelected((selected + samples.length - 1) % samples.length)}>←</button><p>{samples[selected]?.photo.story}<span>0{selected + 1} / 0{samples.length}</span></p><button type="button" aria-label="다음 사진" onClick={() => setSelected((selected + 1) % samples.length)}>→</button></div>
      </dialog>
    </section>
  );
}

export default function ComA() {
  const [slots] = useState(() => makeSlots(concepts[0].photos));
  useSmoothWheelScroll();
  return (
    <main className="component-prototype com-a">
      <header><SiteBrand compact /><span>COMPONENT STUDY / COM-A</span><Link to="/">all studies ↗</Link></header>
      <section className="component-hero">
        <p className="eyebrow">COM-A · TOTAL STORY SCENE REPRODUCTION</p>
        <h1>흐릿했던 장면이<br /><em>선명해지는 순간.</em></h1>
        <p className="description">total의 Showcase Story Scene을 그대로 옮기고<br />선택 카드의 이동 로직만 비교합니다.</p>
      </section>
      <div className="showcase-stack">
        <ShowcaseScene slots={slots} />
      </div>
      <AffordanceComparison slots={slots} />
      <footer><Link to="/components/d"><ArrowLeft size={15} /> previous</Link><strong>선택 카드 이동 로직 비교</strong><Link to="/components/proto-com-b">next <ArrowRight size={15} /></Link></footer>
    </main>
  );
}
