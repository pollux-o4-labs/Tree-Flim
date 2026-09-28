import { useEffect, type RefObject } from "react";

type AutoTransitionProgressOptions = {
  transition: RefObject<HTMLElement | null>;
  category?: string | null;
  duration?: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeInOutCubic = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
// Once the eased motion is within this small tail, the scene is visually at
// its terminal state. Do not keep swallowing input for the remaining timer
// tail; the visual state and scroll ownership must finish together.
const VISUAL_COMPLETION_THRESHOLD = 0.995;


export function useAutoTransitionProgress({
  transition,
  category,
  duration = 1800,
}: AutoTransitionProgressOptions) {
  useEffect(() => {
    let frame = 0;
    let autoFrame = 0;
    let autoPlaying = false;
    let hasPlayed = false;
    let narrativeScrollLocked = false;
    let navigationPending = false;
    let navigationEntry = false;
    let activeNavigationToken: number | null = null;
    let previousScrollY = window.scrollY;
    let lastScrollY = window.scrollY;
    let scrollDirection = 0;
    let sectionStartCrossed = false;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setNarrativeScrollLock = (locked: boolean) => {
      narrativeScrollLocked = locked;
      window.dispatchEvent(
        new CustomEvent("narrative-scroll-lock", { detail: { locked } }),
      );
    };
    const stopAutoPlayback = () => {
      autoPlaying = false;
      cancelAnimationFrame(autoFrame);
    };
    const resetPlayback = (resetProgress: boolean) => {
      stopAutoPlayback();
      hasPlayed = false;
      if (narrativeScrollLocked) setNarrativeScrollLock(false);
      if (resetProgress) setProgress(0);
    };
    const setProgress = (value: number) => {
      const element = transition.current;
      if (!element) return;
      const progress = clamp(value);
      element.style.setProperty("--progress", String(progress));
      element.dataset.phase = progress > 0.45 ? "ready" : "gathering";
      const categories = element.querySelector<HTMLElement>(".gather-categories");
      if (categories) categories.inert = progress < 0.5 && !reduceMotion;
    };

    const finishAutoPlayback = () => {
      autoPlaying = false;
      setProgress(1);
      setNarrativeScrollLock(false);
    };
    const playToEnd = () => {
      hasPlayed = true;
      if (reduceMotion) {
        finishAutoPlayback();
        return;
      }

      autoPlaying = true;
      const startedAt = performance.now();
      const animate = (now: number) => {
        const progress = clamp((now - startedAt) / duration);
        const eased = easeInOutCubic(progress);
        if (progress >= VISUAL_COMPLETION_THRESHOLD) {
          finishAutoPlayback();
          return;
        }
        setProgress(eased);
        if (progress < 1 && autoPlaying) {
          autoFrame = requestAnimationFrame(animate);
        } else {
          finishAutoPlayback();
        }
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
      if (!isVisible) {
        sectionStartCrossed = false;
        // Keep the completed scene while it is below the viewport. When the
        // user comes back upward, it must remain complete rather than replay
        // from the scattered state. Reset only after leaving upward past the
        // section's top boundary.
        if (rect.top >= innerHeight && scrollDirection < 0) {
          resetPlayback(true);
        }
        return;
      }

      if (narrativeScrollLocked) return;

      if (hasPlayed && isVisible) {
        setProgress(1);
        return;
      }

      // Entering from below is a read-only revisit of the finished scene.
      // Only downward entry owns the autoplay transition.
      if (!hasPlayed && scrollDirection < 0 && !navigationEntry) {
        hasPlayed = true;
        setProgress(1);
        return;
      }

      // The narrative owns progress once the section is approached. Do not
      // let ordinary scrolling partially reveal the scene before commitment.
      setProgress(0);

      const enteringFromAbove = scrollDirection > 0;
      const crossedSectionStart = sectionStartCrossed;
      const canAutoPlay = navigationEntry || enteringFromAbove;
      if (
        !navigationPending &&
        !hasPlayed &&
        !autoPlaying &&
        (navigationEntry || crossedSectionStart) &&
        canAutoPlay
      ) {
        navigationEntry = false;
        setNarrativeScrollLock(true);
        window.scrollTo({ top: sectionStart, left: 0, behavior: "instant" });
        sectionStartCrossed = false;
        playToEnd();
      }
    };

    const onScroll = () => {
      const nextScrollY = window.scrollY;
      previousScrollY = lastScrollY;
      scrollDirection = Math.sign(nextScrollY - lastScrollY);
      lastScrollY = nextScrollY;
      const element = transition.current;
      if (element && previousScrollY < nextScrollY) {
        const sectionStart =
          element.getBoundingClientRect().top + nextScrollY;
        if (previousScrollY < sectionStart && nextScrollY >= sectionStart) {
          sectionStartCrossed = true;
        }
      }
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onSafeNavigationEnd = (event: Event) => {
      const token = (event as CustomEvent<{ token?: number }>).detail?.token;
      if (token !== activeNavigationToken) return;

      activeNavigationToken = null;
      navigationPending = false;
      navigationEntry = true;
      onScroll();
    };
    const onSafeNavigationStart = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; token?: number }>).detail;
      const id = detail?.id;
      const element = transition.current;
      activeNavigationToken = detail?.token ?? null;
      navigationPending = Boolean(element && element.id === id);
      if (!navigationPending) return;

      navigationEntry = true;
      resetPlayback(true);
    };
    const onResize = () => {
      hasPlayed = false;
      navigationEntry = false;
      sectionStartCrossed = false;
      if (narrativeScrollLocked) setNarrativeScrollLock(false);
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener(
      "safe-section-navigation-start",
      onSafeNavigationStart,
    );
    window.addEventListener("safe-section-navigation-end", onSafeNavigationEnd);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(autoFrame);
      if (narrativeScrollLocked) setNarrativeScrollLock(false);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(
        "safe-section-navigation-start",
        onSafeNavigationStart,
      );
      window.removeEventListener(
        "safe-section-navigation-end",
        onSafeNavigationEnd,
      );
    };
  }, [category, duration, transition]);
}
