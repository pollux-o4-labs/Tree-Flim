import { Text, useContentValue, useContentReady } from '../../content-editor/Content';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { concepts, makeSlots, type Photo } from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";
import { useTotalSmoothWheelScroll } from "./useTotalSmoothWheelScroll";
import { cancelTotalSectionNavigation, totalScrollToSectionSafely } from "./totalScrollToSectionSafely";
import TotalFloatingUtilityBubble from "./TotalFloatingUtilityBubble";
import TotalGalleryPage from "./TotalGalleryPage";
import TotalStoryScenes from "./TotalStoryScenes";
import TotalLowerSections from "./TotalLowerSections";
import TotalNews from './TotalNews';
import TotalDialogs from "./TotalDialogs";
import SiteBrand from "../../shared/SiteBrand";
import { useDialogBodyLock } from "./useDialogBodyLock";
import { useTotalSceneProgress } from "./useTotalSceneProgress";
import { useTotalTheme } from "./useTotalTheme";
import { getLoadingPresentation, rememberLoadingVisit } from "./totalLoadingVisit";
import TotalLoadingScreen from "./TotalLoadingScreen";
import { useTotalImagePreparation } from "./useTotalImagePreparation";
import { buildPublishedCollections } from '../../content-editor/publishedArchive';
import { usePublishedArchive } from '../../content-editor/usePublishedArchive';
import "./total.css";
import "./total-theme.css";
import './total-news.css';
import '../../design-system/collection-modal.css';
import '../../design-system/card-stage.css';
import '../../design-system/mobile-deck.css';
import '../../design-system/card-scene.css';

export default function PrototypeTotal() {
  const contentValue = useContentValue();
  const contentReady = useContentReady();
  const [editorPreview] = useState(() => window.parent !== window && new URLSearchParams(location.search).has('editor'));
  const editorIntro = editorPreview && new URLSearchParams(location.search).has('intro');
  const { isDark, toggleTheme } = useTotalTheme();
  const root = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<HTMLElement>(null);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const inquiryDialog = useRef<HTMLDialogElement>(null);
  const returnScrollY = useRef(0);
  const viewTransitionTimer = useRef<number | null>(null);
  const pendingViewScroll = useRef<{ top: number; reduced: boolean } | null>(null);
  const pendingSection = useRef<string | null>(null);
  const sectionNavigationFrame = useRef(0);
  const initialColumnCount = 5;
  const photoColumnCount = useRef(0);
  const [columnCount, setColumnCount] = useState(0);
  const [slots, setSlots] = useState(() =>
    concepts.map((concept) => makeSlots(concept.photos, initialColumnCount)),
  );
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [inquiry, setInquiry] = useState("");
  const [inquirySession, setInquirySession] = useState(0);
  const [search, setSearch] = useSearchParams();
  const category = search.get("gallery");
  const news = search.get('news');
  const publishedArchive = usePublishedArchive();
  const childView = Boolean(category || news);
  const newsListScroll = useRef(0);
  const previousNews = useRef(news);
  const [loadingPresentation] = useState(() => getLoadingPresentation(category));
  const archiveCollections = useMemo(() => buildPublishedCollections(publishedArchive.works, publishedArchive.categories, concepts), [publishedArchive]);
  const preparation = useTotalImagePreparation(root, contentReady && publishedArchive.ready, !editorPreview);
  const [loadingVisible, setLoadingVisible] = useState(editorIntro || preparation.loading);
  const [pageEntering, setPageEntering] = useState(false);
  const [viewTransition, setViewTransition] = useState<"idle" | "leaving" | "entering">("idle");
  const finishLoadingTransition = useCallback(() => {
    rememberLoadingVisit();
    setLoadingVisible(false);
    setPageEntering(true);
  }, []);
  useLayoutEffect(() => {
    if (!pageEntering) return;
    const timer = window.setTimeout(() => setPageEntering(false), 900);
    return () => window.clearTimeout(timer);
  }, [pageEntering]);
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => { history.scrollRestoration = previous; };
  }, []);
  useEffect(() => () => {
    if (viewTransitionTimer.current) window.clearTimeout(viewTransitionTimer.current);
    cancelAnimationFrame(sectionNavigationFrame.current);
    cancelTotalSectionNavigation();
  }, []);
  const gallery = useMemo(() => {
    if (!category) return undefined;
    const selectedCollection = archiveCollections.find(collection => collection.id === category);
    if (category !== 'all' && selectedCollection) return selectedCollection;
    return { id: 'all', en: 'The Archive', name: '작가의 모든 작품', intro: '', photos: archiveCollections.flatMap(collection => collection.photos) };
  }, [category, archiveCollections]);

  // Retain visited story images across archive visits instead of recreating them.
  const [storyVisited, setStoryVisited] = useState(!gallery);
  if (!gallery && !storyVisited) setStoryVisited(true);
  const previousGallery = useRef(childView);

  // Restore the destination before its first paint and before scene hooks inspect it.
  useLayoutEffect(() => {
    const changedView = previousGallery.current !== childView;
    const oldNews = previousNews.current;
    previousNews.current = news;
    previousGallery.current = childView;
    const pending = pendingViewScroll.current;
    if (!pending) {
      if (changedView) window.scrollTo({ top: childView ? 0 : returnScrollY.current, behavior: "instant" });
      else if (oldNews !== news) window.scrollTo({ top: news === 'all' ? newsListScroll.current : 0, behavior: 'instant' });
      return;
    }
    pendingViewScroll.current = null;
    const sectionId = pendingSection.current;
    pendingSection.current = null;
    const section = sectionId ? document.getElementById(sectionId) : null;
    window.scrollTo({ top: section ? section.getBoundingClientRect().top + window.scrollY : pending.top, behavior: "instant" });
    if (sectionId) {
      sectionNavigationFrame.current = requestAnimationFrame(() => totalScrollToSectionSafely(sectionId));
    }
    setViewTransition("entering");
    viewTransitionTimer.current = window.setTimeout(() => setViewTransition("idle"), pending.reduced ? 0 : 240);
  }, [category, gallery, news, childView]);

  useEffect(() => {
    if (news && viewTransition === 'idle') document.getElementById('news-page')?.focus({ preventScroll: true });
  }, [news, viewTransition]);

  const transitionTo = (update: () => void, scrollY: number) => {
    cancelTotalSectionNavigation();
    if (viewTransitionTimer.current) window.clearTimeout(viewTransitionTimer.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setViewTransition("leaving");
    viewTransitionTimer.current = window.setTimeout(() => {
      pendingViewScroll.current = { top: scrollY, reduced };
      update();
    }, reduced ? 0 : 120);
  };
  const openGallery = (id: string) => {
    if (id === category) return;
    if (gallery) {
      setSearch({ gallery: id });
      return;
    }
    returnScrollY.current = window.scrollY;
    transitionTo(() => setSearch({ gallery: id }), 0);
  };
  const closeGallery = () => {
    transitionTo(() => setSearch({}, { replace: true }), returnScrollY.current);
  };
  const openNews = (id: string) => {
    if (!childView) returnScrollY.current = window.scrollY;
    if (news === 'all') newsListScroll.current = window.scrollY;
    transitionTo(() => setSearch({ news: id }), id === 'all' && news ? newsListScroll.current : 0);
  };
  const goToSection = (id: string) => {
    if (childView) {
      pendingSection.current = id;
      transitionTo(() => setSearch({}), 0);
    } else {
      totalScrollToSectionSafely(id);
    }
  };
  const openPhoto = (nextPhoto: Photo) => {
    setPhoto(nextPhoto);
    setFlipped(false);
    photoDialog.current?.showModal();
  };
  const openInquiry = (label: string) => {
    setInquirySession(value => value + 1);
    setInquiry(label);
    inquiryDialog.current?.showModal();
  };
  const editorPhoto = search.get('storyPhoto');
  useEffect(() => {
    if (!editorPreview || !editorPhoto) return;
    const work = publishedArchive.works?.find(w => `archive-${w.id}` === editorPhoto);
    const selected = work ? { id: `archive-${work.id}`, src: work.image, story: work.title, category: work.category, note: work.note, location: work.location } : concepts.flatMap(c => c.photos).find(p => p.id === editorPhoto);
    if (selected) { setPhoto(selected); setFlipped(true); photoDialog.current?.showModal(); }
  }, [editorPreview, editorPhoto, publishedArchive]);
  const editorPanel = search.get('panel');
  useEffect(() => {
    if (editorPreview && editorPanel && !loadingVisible) openInquiry(editorPanel);
  }, [editorPreview, editorPanel, loadingVisible]);

  useLayoutEffect(() => {
    if (childView) return;
    const field = root.current?.querySelector<HTMLElement>(".photo-field");
    if (!field || typeof ResizeObserver === "undefined") return;
    const syncSlotsToLayout = () => {
      const columnCount = getComputedStyle(field).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length;
      if (!columnCount) return;
      if (columnCount === photoColumnCount.current) {
        return;
      }
      photoColumnCount.current = columnCount;
      setColumnCount(columnCount);
      setSlots(concepts.map((concept) => makeSlots(concept.photos, columnCount)));
    };
    const observer = new ResizeObserver(syncSlotsToLayout);
    observer.observe(field);
    window.addEventListener("resize", syncSlotsToLayout);
    syncSlotsToLayout();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncSlotsToLayout);
    };
  }, [childView]);

  // Gallery is a child view of Total, so it keeps the same wheel-scroll policy.
  useTotalSmoothWheelScroll({ disabled: loadingVisible || viewTransition !== "idle" });
  const sceneContentKey = `${contentReady && publishedArchive.ready}:${concepts.map(c => contentValue(`story.${c.id}.collection`, c.name)).join(',')}:${columnCount}:${archiveCollections.flatMap(c => c.photos).map(p => p.id).join(',')}:${concepts.flatMap(c => [0, 1, 2].map(i => contentValue(`story.${c.id}.${i}`, c.photos[i].id))).join(',')}`;
  useTotalSceneProgress(root, transitionRef, category ?? (news ? 'news' : null), sceneContentKey);
  useDialogBodyLock(photoDialog, inquiryDialog);

  return (
    <div
      ref={root}
      className="prototype prototype-total"
      data-theme={isDark ? "dark" : "light"}
      data-route-transition={viewTransition}
      data-loading-state={loadingVisible ? (preparation.loading ? "preparing" : "leaving") : pageEntering ? "leaving" : "ready"}
    >
      {loadingVisible && <TotalLoadingScreen failed={preparation.failed} onRetry={preparation.retry} presentation={loadingPresentation} progress={preparation.progress} onSkip={editorIntro ? finishLoadingTransition : preparation.skip} exiting={!preparation.loading && !editorIntro} onExited={finishLoadingTransition} />}
      <div className="total-content" inert={loadingVisible || viewTransition !== "idle"} aria-busy={loadingVisible || viewTransition !== "idle"}>
      <header className="site-header">
        <SiteBrand />
        <nav aria-label="주 메뉴">
          <a href="#showcase" onClick={(event) => { event.preventDefault(); goToSection("showcase"); }}><Text id="PrototypeTotal.001" section="공통">{"Work "}</Text><span><Text id="PrototypeTotal.002" section="공통">{"작업"}</Text></span>
          </a>
          <a href="#about" onClick={(event) => { event.preventDefault(); goToSection("about"); }}><Text id="PrototypeTotal.003" section="공통">{"About "}</Text><span><Text id="PrototypeTotal.004" section="공통">{"소개"}</Text></span>
          </a>
          <button onClick={() => openInquiry("촬영 문의")}><Text id="PrototypeTotal.005" section="공통">{"Contact "}</Text><ArrowUpRight size={14} />
          </button>
        </nav>
      </header>
      {gallery && (editorPreview || (contentReady && publishedArchive.ready)) && (
        <TotalGalleryPage
          gallery={gallery}
          concepts={archiveCollections}
          onOpenGallery={openGallery}
          onClose={closeGallery}
          onOpenPhoto={openPhoto}
        />
      )}
      {news && !gallery && <TotalNews selected={news} onOpen={openNews} onClose={closeGallery} onInquiry={openInquiry} />}
      {storyVisited && (editorPreview || (contentReady && publishedArchive.ready)) && (
        <main hidden={childView} inert={childView} className="total-story">
          <TotalStoryScenes
            chapters={concepts.map(c => {
              const name = contentValue(`story.${c.id}.collection`, c.name);
              const collection = archiveCollections.find(a => a.name === name);
              return { ...c, name, en: collection?.en ?? 'Collection', intro: collection?.intro ?? '', photos: collection?.photos ?? [] };
            })}
            slots={slots.map((chapterSlots, chapterIndex) => {
              let selection = 0;
              const concept = concepts[chapterIndex];
              const name = contentValue(`story.${concept.id}.collection`, concept.name);
              const collection = archiveCollections.find(c => c.name === name);
              const emphasized = [0, 1, 2].map(i => {
                const id = contentValue(`story.${concept.id}.${i}`, concept.photos[i].id);
                return id.startsWith('archive-') ? id : `archive-seed-${id}`;
              });
              const remaining = collection?.photos.filter(p => !emphasized.includes(p.id)) ?? [];
              const backgrounds = remaining.length ? remaining : collection?.photos ?? [];
              let background = 0;
              return chapterSlots.map(slot => {
                if (!slot.featured) {
                  const photo = backgrounds[background++ % (backgrounds.length || 1)];
                  return photo ? { ...slot, photo } : null;
                }
                const index = selection++;
                const selectedId = contentValue(`story.${concept.id}.${index}`, concept.photos[index].id);
                const canonicalId = selectedId.startsWith('archive-') ? selectedId : `archive-seed-${selectedId}`;
                const selected = collection?.photos.find(p => p.id === canonicalId);
                // Unpublished or deleted works must never remain featured.
                return selected ? { ...slot, photo: selected } : null;
              }).filter((slot): slot is NonNullable<typeof slot> => slot !== null);
            })}
            transitionRef={transitionRef}
            onOpenGallery={openGallery}
            onOpenPhoto={openPhoto}
          />
          <TotalLowerSections onOpenInquiry={openInquiry} onOpenNews={openNews} />
        </main>
      )}
      <footer className="site-footer">
        <SiteBrand compact />
        <p><Text id="PrototypeTotal.006" section="공통">{"평범한 순간을, 오래도록."}</Text></p>
        <span><Text id="PrototypeTotal.007" section="공통">{"© 2026 "}</Text><Text id={"brand.artistNameLatin"} section="공통">{siteIdentity.artistNameLatin}</Text><Text id="PrototypeTotal.008" section="공통">{" · "}</Text><Text id="brand.studioName" section="브랜드">{siteIdentity.studioName.toUpperCase()}</Text></span>
      </footer>
      <TotalDialogs
        photo={photo}
        flipped={flipped}
        setFlipped={setFlipped}
        inquiry={inquiry}
        inquirySession={inquirySession}
        photoDialog={photoDialog}
        inquiryDialog={inquiryDialog}
      />
      <TotalFloatingUtilityBubble
        theme={isDark ? "dark" : "light"}
        onToggleTheme={toggleTheme}
      />
      </div>
    </div>
  );
}
