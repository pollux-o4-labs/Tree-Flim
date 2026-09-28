import { useLayoutEffect, useRef, type RefObject } from "react";

type Options = { transition: RefObject<HTMLElement | null>; category?: string | null; duration?: number };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeInOutCubic = (value: number) => value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
const VISUAL_COMPLETION_THRESHOLD = 0.995;

export function useTotalAutoTransitionProgress({ transition, category, duration = 1800 }: Options) {
  const played = useRef(false);
  useLayoutEffect(() => {
    if (category) return;
    let frame = 0;
    let autoFrame = 0;
    let autoPlaying = false;
    let hasPlayed = played.current;
    let narrativeScrollLocked = false;
    let navigationPending = false;
    let navigationEntry = false;
    let activeNavigationToken: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollDirection = 0;
    let sectionStartCrossed = false;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setNarrativeScrollLock = (locked: boolean) => {
      narrativeScrollLocked = locked;
      if (transition.current) transition.current.dataset.scrollLocked = String(locked);
      window.dispatchEvent(new CustomEvent("narrative-scroll-lock", { detail: { locked } }));
    };
    const stopAutoPlayback = () => { autoPlaying = false; cancelAnimationFrame(autoFrame); };
    const setProgress = (value: number) => {
      const element = transition.current;
      if (!element) return;
      const progress = clamp(value);
      element.style.setProperty("--progress", String(progress));
      element.dataset.phase = progress > 0.45 ? "ready" : "gathering";
      const archive = element.querySelector<HTMLElement>(".gather-archive");
      element.dataset.complete = String(progress === 1);
      if (archive) archive.inert = progress !== 1;
      const categories = element.querySelector<HTMLElement>(".gather-categories");
      if (categories) categories.inert = progress < 0.5 && !reduceMotion;
    };
    const resetPlayback = (resetProgress: boolean) => {
      stopAutoPlayback();
      hasPlayed = false;
      if (narrativeScrollLocked) setNarrativeScrollLock(false);
      if (resetProgress) setProgress(0);
    };
    const finishAutoPlayback = () => { autoPlaying = false; setProgress(1); setNarrativeScrollLock(false); };
    const playToEnd = () => {
      hasPlayed = true;
      if (reduceMotion) { finishAutoPlayback(); return; }
      autoPlaying = true;
      const startedAt = performance.now();
      const animate = (now: number) => {
        const progress = clamp((now - startedAt) / duration);
        if (progress >= VISUAL_COMPLETION_THRESHOLD) { finishAutoPlayback(); return; }
        setProgress(easeInOutCubic(progress));
        autoFrame = requestAnimationFrame(animate);
      };
      autoFrame = requestAnimationFrame(animate);
    };
    const update = () => {
      frame = 0;
      const element = transition.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const sectionStart = rect.top + window.scrollY;
      const isVisible = rect.bottom > 0 && rect.top < innerHeight;
      if (navigationPending) return;
      if (!isVisible) {
        sectionStartCrossed = false;
        if (rect.top >= innerHeight && scrollDirection < 0) resetPlayback(true);
        return;
      }
      if (narrativeScrollLocked) return;
      if (hasPlayed) { setProgress(1); return; }
      if (scrollDirection < 0 && !navigationEntry) { hasPlayed = true; setProgress(1); return; }
      setProgress(0);
      if (!navigationPending && !hasPlayed && !autoPlaying && (navigationEntry || sectionStartCrossed) && (navigationEntry || scrollDirection > 0)) {
        navigationEntry = false;
        setNarrativeScrollLock(true);
        window.scrollTo({ top: sectionStart, left: 0, behavior: "instant" });
        sectionStartCrossed = false;
        playToEnd();
      }
    };
    const onScroll = () => {
      const nextScrollY = window.scrollY;
      const previousScrollY = lastScrollY;
      if (nextScrollY !== lastScrollY) scrollDirection = Math.sign(nextScrollY - lastScrollY);
      lastScrollY = nextScrollY;
      const element = transition.current;
      if (element && previousScrollY < nextScrollY) {
        const sectionStart = element.getBoundingClientRect().top + nextScrollY;
        if (previousScrollY < sectionStart && nextScrollY >= sectionStart) sectionStartCrossed = true;
      }
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onSafeNavigationStart = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; token?: number }>).detail;
      activeNavigationToken = detail?.token ?? null;
      // All explicit navigation owns scrolling, including travel past this section.
      navigationPending = true;
      navigationEntry = transition.current?.id === detail?.id;
      if (autoPlaying) { stopAutoPlayback(); finishAutoPlayback(); }
    };
    const onSafeNavigationEnd = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: number; cancelled?: boolean }>).detail;
      if (detail?.token !== activeNavigationToken) return;
      activeNavigationToken = null;
      navigationPending = false;
      navigationEntry = navigationEntry && !detail?.cancelled;
      sectionStartCrossed = false;
      if (navigationEntry) resetPlayback(false);
      onScroll();
    };
    const onResize = () => {
      // A resized viewport changes geometry, not the visitor's narrative history.
      if (autoPlaying) { stopAutoPlayback(); finishAutoPlayback(); }
      sectionStartCrossed = false;
      lastScrollY = window.scrollY;
      scrollDirection = 0;
      if (!frame) frame = requestAnimationFrame(update);
    };
    setProgress(hasPlayed ? 1 : 0);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("safe-section-navigation-start", onSafeNavigationStart);
    window.addEventListener("safe-section-navigation-end", onSafeNavigationEnd);
    return () => {
      played.current = hasPlayed;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(autoFrame);
      if (narrativeScrollLocked) setNarrativeScrollLock(false);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("safe-section-navigation-start", onSafeNavigationStart);
      window.removeEventListener("safe-section-navigation-end", onSafeNavigationEnd);
    };
  }, [category, duration, transition]);
}
