import { Text, ContentImage } from '../../content-editor/Content';
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, LoaderCircle } from "lucide-react";
import GalleryCrossfade, { GALLERY_CROSSFADE_DURATION } from "./GalleryCrossfade";
import { getPreparedPhoto, preparePhoto, type PreparedPhoto } from "./totalPreparedPhotos";
import { TOTAL_GALLERY_PAGE_SIZE, type TotalConcept, type OpenPhoto } from "./totalTypes";

type Props = {
  gallery: TotalConcept;
  concepts: readonly TotalConcept[];
  onOpenGallery: (id: string) => void;
  onClose: () => void;
  onOpenPhoto: OpenPhoto;
};

export default function TotalGalleryPage(props: Props) {
  const [displayed, setDisplayed] = useState(props.gallery);
  const [phase, setPhase] = useState<"idle" | "entering">("idle");
  const switching = displayed.id !== props.gallery.id;

  useEffect(() => {
    let active = true;
    let timer = 0;
    setPhase("idle");
    if (displayed.id === props.gallery.id) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Prepare the destination before overlapping it with the current content.
    void Promise.all(props.gallery.photos.slice(0, TOTAL_GALLERY_PAGE_SIZE).map(preparePhoto))
      .catch(() => undefined)
      .then(() => {
        if (!active) return;
        if (reduced) { setDisplayed(props.gallery); return; }
        setDisplayed(props.gallery);
        setPhase("entering");
        timer = window.setTimeout(() => setPhase("idle"), GALLERY_CROSSFADE_DURATION);
      });
    return () => { active = false; window.clearTimeout(timer); };
    // Only a new destination starts a transition; the displayed update is its result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.gallery]);

  return <Gallery {...props} gallery={displayed} selectedId={props.gallery.id} switching={switching} phase={phase} />;
}

function Gallery({
  gallery,
  concepts,
  onOpenGallery,
  onClose,
  onOpenPhoto,
  selectedId,
  switching,
  phase,
}: Props & { selectedId: string; switching: boolean; phase: "idle" | "entering" }) {
  const initialPhotos = (entry: TotalConcept) => {
    const batch = entry.photos.slice(0, TOTAL_GALLERY_PAGE_SIZE).map(getPreparedPhoto);
    return batch.every((photo): photo is PreparedPhoto => Boolean(photo)) ? batch : [];
  };
  const [activeGallery, setActiveGallery] = useState(gallery.id);
  const [photos, setPhotos] = useState<PreparedPhoto[]>(() => initialPhotos(gallery));
  const [requestedCount, setRequestedCount] = useState(TOTAL_GALLERY_PAGE_SIZE);
  const [error, setError] = useState(false);
  const [settling, setSettling] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Reset only the results, keeping the header, tabs and keyboard focus mounted.
  if (activeGallery !== gallery.id) {
    setActiveGallery(gallery.id);
    setPhotos(initialPhotos(gallery));
    setRequestedCount(TOTAL_GALLERY_PAGE_SIZE);
    setError(false);
    setSettling(false);
  }
  const visibleCount = photos.length;
  const loading = !error && visibleCount < Math.min(requestedCount, gallery.photos.length);
  const hasMore = visibleCount < gallery.photos.length;

  useEffect(() => {
    if (visibleCount >= Math.min(requestedCount, gallery.photos.length)) return;
    let cancelled = false;
    setError(false);
    Promise.all(gallery.photos.slice(visibleCount, requestedCount).map(preparePhoto))
      .then((batch) => {
        if (!cancelled) {
          setSettling(visibleCount > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          setPhotos((previous) => [...previous, ...batch]);
        }
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [gallery.photos, requestedCount, visibleCount, attempt]);

  useEffect(() => {
    if (!settling) return;
    // Covers interrupted animations or a motion-preference change during entry.
    const timer = window.setTimeout(() => setSettling(false), 1000);
    return () => window.clearTimeout(timer);
  }, [settling]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || loading || settling || error || switching || phase !== "idle") return;
    let requested = false;
    const observer = new IntersectionObserver(entries => {
      if (requested || !entries.some(entry => entry.isIntersecting)) return;
      requested = true;
      setRequestedCount(Math.min(visibleCount + TOTAL_GALLERY_PAGE_SIZE, gallery.photos.length));
    }, { rootMargin: "0px 0px 160px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [gallery.photos.length, visibleCount, hasMore, loading, settling, error, switching, phase]);

  const batches = Array.from({ length: Math.ceil(photos.length / TOTAL_GALLERY_PAGE_SIZE) }, (_, index) =>
    photos.slice(index * TOTAL_GALLERY_PAGE_SIZE, (index + 1) * TOTAL_GALLERY_PAGE_SIZE),
  );

  return (
    <main className="gallery-page" data-filter-transition={phase}>
      <button className="text-button" onClick={onClose}>
        <ArrowLeft size={17} /><Text id="TotalGalleryPage.001" section="갤러리">{" 이야기로 돌아가기"}</Text></button>
      <GalleryCrossfade identity={gallery.id}>
      <header className="gallery-heading">
      <div>
      <p className="eyebrow"><Text id="TotalGalleryPage.002" section="갤러리">{"THE ARCHIVE / SELECTED MOMENTS"}</Text></p>
      <h1>
        <Text id={`concept.${gallery.id}.en`} section="갤러리">{gallery.en}</Text>
        <em><Text id={`concept.${gallery.id}.name`} section="갤러리">{gallery.name}</Text></em>
      </h1>
      </div>
      <p className="gallery-intro"><Text id={`concept.${gallery.id}.intro`} section="갤러리">{gallery.intro || "스쳐 가는 순간을 모아, 오래 머무는 장면으로."}</Text><span><Text id="TotalGalleryPage.003" section="갤러리">{"PHOTOGRAPHY BY SANGMOK"}</Text></span></p>
      </header>
      </GalleryCrossfade>
      <div className="gallery-tabs">
        <button aria-pressed={selectedId === "all"} onClick={() => onOpenGallery("all")}><Text id="TotalGalleryPage.004" section="갤러리">{"전체 작품 "}</Text><span>{concepts.reduce((count, concept) => count + concept.photos.length, 0)}</span>
        </button>
        {concepts.map((concept) => (
          <button
            aria-pressed={concept.id === selectedId}
            key={concept.id}
            onClick={() => onOpenGallery(concept.id)}
          >
            <Text id={`concept.${concept.id}.name`} section="갤러리">{concept.name}</Text> <span>{concept.photos.length}</span>
          </button>
        ))}
      </div>
      <GalleryCrossfade identity={gallery.id}>
      <div className="gallery-index" aria-hidden="true">
        <span><Text id="TotalGalleryPage.005" section="갤러리">{"INDEX / "}</Text><Text id={`concept.${gallery.id}.index`} section="갤러리">{gallery.id === "all" ? "ALL MOMENTS" : gallery.en.toUpperCase()}</Text></span>
        <span>{String(gallery.photos.length).padStart(2, "0")}<Text id="TotalGalleryPage.006" section="갤러리">{" PHOTOGRAPHS"}</Text></span>
      </div>
      <div className="gallery-batches" aria-busy={loading || settling || switching || phase !== "idle"}>
        {loading && visibleCount === 0 && (
          <div className="gallery-entry-loading" role="status">
            <LoaderCircle size={16} aria-hidden="true" /><Text id="TotalGalleryPage.007" section="갤러리">{"첫 장면을 준비하는 중"}</Text></div>
        )}
        {batches.map((batch, batchIndex) => (
        <div className={`gallery-grid${batchIndex === 0 ? " gallery-grid-entry" : ""}`} data-batch={batchIndex} key={batchIndex} onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === "gallery-batch-enter" && batchIndex === batches.length - 1) setSettling(false);
        }}>
        {batch.map((photo, index) => (
          <button className="gallery-work" key={photo.id} onClick={() => onOpenPhoto(photo)} aria-label={`${photo.story} — 작품 크게 보기`}>
            <span className="gallery-image">
              <ContentImage field={`photo.${photo.id}.src`} section="갤러리" src={photo.src} alt={photo.story} width={photo.width} height={photo.height} decoding="async" />
              <span className="gallery-view" aria-hidden="true"><ArrowUpRight size={20} /></span>
            </span>
            <span className="gallery-caption">
              <span className="gallery-number">{String(batchIndex * TOTAL_GALLERY_PAGE_SIZE + index + 1).padStart(2, "0")}</span>
              <span className="gallery-story"><Text id={`photo.${photo.id}.story`} section="갤러리">{photo.story}</Text><span className="gallery-category"><Text id={`photo.${photo.id}.category`} section="갤러리">{photo.category}</Text></span></span>
            </span>
          </button>
        ))}
        </div>
        ))}
      </div>
      <div className="gallery-continuation" ref={loadMoreRef}>
        <p className="gallery-progress" role="status">{Math.min(visibleCount, gallery.photos.length)}<Text id="TotalGalleryPage.008" section="갤러리">{" / "}</Text>{gallery.photos.length}<Text id="TotalGalleryPage.009" section="갤러리">{"개의 기록"}</Text></p>
        <span className="gallery-progress-line" aria-hidden="true"><span style={{ width: `${Math.min(visibleCount / gallery.photos.length, 1) * 100}%` }} /></span>
        {loading ? (
          <p className="gallery-loading" aria-hidden="true"><LoaderCircle size={16} /><Text id="TotalGalleryPage.010" section="갤러리">{" 다음 장면을 불러오는 중"}</Text></p>
        ) : settling ? (
          <p className="gallery-loading" role="status"><Text id="TotalGalleryPage.011" section="갤러리">{"새로운 장면이 이어집니다"}</Text></p>
        ) : error ? (
          <div><p className="gallery-progress" role="status"><Text id="TotalGalleryPage.012" section="갤러리">{"사진을 불러오지 못했습니다."}</Text></p><button className="gallery-more" onClick={() => { setError(false); setAttempt((value) => value + 1); }}><Text id="TotalGalleryPage.013" section="갤러리">{"다시 불러오기"}</Text></button></div>
        ) : hasMore ? (
          <div>
            <p className="gallery-progress"><Text id="TotalGalleryPage.014" section="갤러리">{"아래로 내려가면 다음 작품을 자동으로 불러옵니다."}</Text></p>
            <button className="gallery-more" onClick={() => setRequestedCount(Math.min(visibleCount + TOTAL_GALLERY_PAGE_SIZE, gallery.photos.length))}><Text id="TotalGalleryPage.015" section="갤러리">{"지금 더 보기 "}</Text><span aria-hidden="true"><Text id="TotalGalleryPage.016" section="갤러리">{"↓"}</Text></span>
            </button>
          </div>
        ) : (
          <p className="gallery-end"><Text id="TotalGalleryPage.017" section="갤러리">{"잠시 머물러 주셔서 감사합니다."}</Text><em><Text id="TotalGalleryPage.018" section="갤러리">{"Every moment, a little longer."}</Text></em></p>
        )}
      </div>
      </GalleryCrossfade>
      {loading && visibleCount > 0 && !switching && (
        <div className="gallery-fetch-feedback" role="status">
          <LoaderCircle size={16} aria-hidden="true" /><Text id="TotalGalleryPage.019" section="갤러리">{" 추가 작품을 불러오는 중"}</Text></div>
      )}
    </main>
  );
}
