import { Text, ContentImage } from '../../content-editor/Content';
import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { CSSProperties, RefObject } from "react";
import { concepts } from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";
import type { OpenPhoto, TotalSlot } from "./totalTypes";

type Props = {
  slots: readonly (readonly TotalSlot[])[];
  transitionRef: RefObject<HTMLElement | null>;
  onOpenGallery: (id: string) => void;
  onOpenPhoto: OpenPhoto;
};

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">
          <i className="dot" /><Text id="TotalStoryScenes.001" section="메인 · 작업">{" PHOTOGRAPHY BY "}</Text><Text id={"brand.artistNameLatin"} section="메인 · 작업">{siteIdentity.artistNameLatin}</Text>
        </p>
        <h1><Text id="TotalStoryScenes.002" section="메인 · 작업">{"우리가 지나온"}</Text><br />
          <em><Text id="TotalStoryScenes.003" section="메인 · 작업">{"작고 다정한 날들."}</Text></em>
        </h1>
        <p><Text id="TotalStoryScenes.004" section="메인 · 작업">{"제가 아름답다고 느낀 순간이,"}</Text><br /><Text id="TotalStoryScenes.005" section="메인 · 작업">{"당신에게도 아름답기를 바랍니다."}</Text></p>
        <a className="hero-scroll" href="#stories"><Text id="TotalStoryScenes.006" section="메인 · 작업">{"이야기를 따라 내려가 보세요 "}</Text><ArrowDown size={16} />
        </a>
      </div>
      <div className="hero-image">
        <ContentImage field={"TotalStoryScenes.007.image"} section="메인 · 작업"
          src={concepts[0].photos[0].src}
          alt="야외에서 함께하는 두 사람의 자연스러운 웨딩 스냅"
          fetchPriority="high"
        />
        <span className="hero-handwriting"><Text id="TotalStoryScenes.008" section="메인 · 작업">{"Just the way you are."}</Text></span>
        <span className="image-caption"><Text id="TotalStoryScenes.009" section="메인 · 작업">{"01 / TOGETHER, AS WE ARE"}</Text></span>
      </div>
      <div className="hero-bottom">
        <span><Text id="TotalStoryScenes.010" section="메인 · 작업">{"빛과 사람, 그 사이의 이야기"}</Text></span>
        <span><Text id="TotalStoryScenes.011" section="메인 · 작업">{"SELECTED STORIES — 2026"}</Text></span>
      </div>
    </section>
  );
}

function StoryScenes({ slots, onOpenPhoto }: Pick<Props, "slots" | "onOpenPhoto">) {
  return (
    <div id="stories">
      {concepts.map((concept, conceptIndex) => (
        <section className="story-scene" key={concept.id}>
          <div className="scene-heading reveal">
            <span className="eyebrow"><Text id="TotalStoryScenes.012" section="메인 · 작업">{"CHAPTER 0"}</Text>{conceptIndex + 1}<Text id="TotalStoryScenes.013" section="메인 · 작업">{" / "}</Text><Text id={`concept.${concept.id}.en`} section="작업">{concept.en.toUpperCase()}</Text>
            </span>
            <h2>
              <Text id={`concept.${concept.id}.name`} section="메인 · 작업">{concept.name}</Text>
              <span><Text id="TotalStoryScenes.014" section="메인 · 작업">{"."}</Text></span>
            </h2>
            <p><Text id={`concept.${concept.id}.intro`} section="메인 · 작업">{concept.intro}</Text></p>
          </div>
          <div className="photo-field">
            {slots[conceptIndex].map(({ photo, featured }, index) => (
              <button
                key={index}
                data-slot={index}
                tabIndex={featured ? 0 : -1}
                aria-hidden={!featured}
                className={
                  "scene-photo " + (featured ? "featured reveal" : "blurred")
                }
                style={
                  {
                    "--slot": index,
                    "--turn": ((index * 7) % 11) - 5 + "deg",
                    "--delay": featured
                      ? slots[conceptIndex]
                          .slice(0, index)
                          .filter((slot) => slot.featured).length *
                          0.14 +
                        "s"
                      : "0s",
                  } as CSSProperties
                }
                onClick={() => featured && onOpenPhoto(photo)}
              >
                <ContentImage field={`photo.${photo.id}.src`} section="메인 · 작업" src={photo.src} alt={featured ? photo.story : ""} loading="eager" decoding="async" />
                {featured && (
                  <>
                    <span className="photo-story"><Text id={`photo.${photo.id}.story`} section="메인 · 작업">{photo.story}</Text></span>
                    <span className="photo-open"><Text id="TotalStoryScenes.015" section="메인 · 작업">{"이 순간 들여다보기 ↗"}</Text></span>
                  </>
                )}
              </button>
            ))}
          </div>
          <div className="scene-footnote">
            <span><Text id="TotalStoryScenes.016" section="메인 · 작업">{"0"}</Text>{conceptIndex + 1}<Text id="TotalStoryScenes.017" section="메인 · 작업">{" — THREE MOMENTS, ONE STORY"}</Text></span>
            <span><Text id="TotalStoryScenes.018" section="메인 · 작업">{"사진에 머물면, 이야기가 보입니다."}</Text></span>
          </div>
        </section>
      ))}
    </div>
  );
}

function Gather({ onOpenGallery, transitionRef }: Pick<Props, "onOpenGallery" | "transitionRef">) {
  return (
    <section className="transition gather" ref={transitionRef} id="showcase">
      <div className="transition-sticky">
        <div className="transition-title">
          <p className="eyebrow"><Text id="TotalStoryScenes.019" section="메인 · 작업">{"EVERY MOMENT FINDS ITS PLACE"}</Text></p>
          <h2><Text id="TotalStoryScenes.020" section="메인 · 작업">{"흩어진 순간이,"}</Text><br />
            <em><Text id="TotalStoryScenes.021" section="메인 · 작업">{"하나의 이야기로."}</Text></em>
          </h2>
          <p className="gather-value"><Text id="TotalStoryScenes.022" section="메인 · 작업">{"흩어진 장면들이, 당신만의 이야기로 모입니다."}</Text></p>
        </div>
        <div className="gather-archive" inert>
          <p className="archive-caption"><Text id="TotalStoryScenes.023" section="메인 · 작업">{"PHOTOGRAPHS BY "}</Text><Text id={"brand.artistNameLatin"} section="메인 · 작업">{siteIdentity.artistNameLatin}</Text></p>
          <p className="archive-title"><Text id="TotalStoryScenes.024" section="메인 · 작업">{"The Archive"}</Text><span><Text id="TotalStoryScenes.025" section="메인 · 작업">{"오래 머물고 싶은 순간들"}</Text></span></p>
          <button className="archive-entry" onClick={() => onOpenGallery("all")}><Text id="TotalStoryScenes.026" section="메인 · 작업">{"작가의 모든 작품 보기 "}</Text><ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="gather-images">
          {concepts.flatMap((concept, conceptIndex) =>
            concept.photos.slice(3, 7).map((photo, photoIndex) => (
              <ContentImage field={`photo.${photo.id}.src`} section="메인 · 작업"
                key={photo.id}
                src={photo.src}
                alt=""
                loading="eager" decoding="async"
                style={
                  {
                    "--group": conceptIndex,
                    "--x": (((conceptIndex * 4 + photoIndex) % 4) - 1.5) * 25 + "vw",
                    "--y": (Math.floor((conceptIndex * 4 + photoIndex) / 4) - 1) * 23 + "vh",
                    "--r": (photoIndex - 1.5) * 12 + "deg",
                  } as CSSProperties
                }
              />
            )),
          )}
        </div>
        <div className="gather-categories">
          {concepts.map((concept, index) => (
            <button key={concept.id} onClick={() => onOpenGallery(concept.id)}>
              <span><Text id="TotalStoryScenes.027" section="메인 · 작업">{"0"}</Text>{index + 1}</span>
              <h3><Text id={`concept.${concept.id}.en`} section="메인 · 작업">{concept.en}</Text></h3>
              <p>
                <Text id={`concept.${concept.id}.name`} section="메인 · 작업">{concept.name}</Text> <ArrowUpRight size={18} />
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TotalStoryScenes(props: Props) {
  return (
    <>
      <Hero />
      <StoryScenes slots={props.slots} onOpenPhoto={props.onOpenPhoto} />
      <Gather
        onOpenGallery={props.onOpenGallery}
        transitionRef={props.transitionRef}
      />
    </>
  );
}
