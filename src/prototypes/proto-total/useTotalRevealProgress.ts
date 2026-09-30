import { useEffect, type RefObject } from "react";
import { observeTotalSceneActivity } from "./totalSceneActivity";
import { isPortfolioMobileViewport } from "../../shared/portfolioViewport";

const photoRevealEnterThreshold = 0.14; // 선택 사진이 이 비율 이상 들어오면 활성화 시작
const photoRevealResetThreshold = 0; // 화면을 완전히 벗어난 뒤에만 재등장을 준비한다.
const desktopRevealStartDelay = 1500; // 데스크톱 선택 사진 대기 시간(ms)
const mobileRevealStartDelay = 845; // 모바일 선택 사진 대기 시간(ms)

type RevealQueue = {
  waiting: HTMLElement[];
  active: HTMLElement | null;
  timer: number | null;
};

const syncSceneFocus = (element: Element) => {
  const scene = element.closest<HTMLElement>(".story-scene");
  if (!scene) return;
  const field = scene.querySelector<HTMLElement>(".photo-field");
  if (!field) return;
  const columns = getComputedStyle(field).gridTemplateColumns.split(" ").length;
  const activeSlots = Array.from(
    scene.querySelectorAll<HTMLElement>(".scene-photo.featured.reveal.visible"),
  ).map((photo) => Number(photo.dataset.slot));

  field.querySelectorAll<HTMLElement>(".scene-photo.blurred").forEach((photo) => {
    const slot = Number(photo.dataset.slot);
    const row = Math.floor(slot / columns);
    const column = slot % columns;
    const nearby = activeSlots.some((activeSlot) => {
      const activeRow = Math.floor(activeSlot / columns);
      const activeColumn = activeSlot % columns;
      const sameRow = row === activeRow && Math.abs(column - activeColumn) === 1;
      const sameColumn = column === activeColumn && Math.abs(row - activeRow) === 1;
      return sameRow || sameColumn;
    });
    photo.classList.toggle("focus-nearby", nearby);
  });
};

export function useTotalRevealProgress(
  root: RefObject<HTMLDivElement | null>,
  category: string | null,
  layoutKey: number | string,
) {
  useEffect(() => {
    if (category) return;
    let suspended = false;
    const revealStartDelay = isPortfolioMobileViewport()
      ? mobileRevealStartDelay
      : desktopRevealStartDelay;
    const sceneQueues = new Map<HTMLElement, RevealQueue>();
    const getQueue = (scene: HTMLElement) => {
      const existing = sceneQueues.get(scene);
      if (existing) return existing;
      const queue: RevealQueue = { waiting: [], active: null, timer: null };
      sceneQueues.set(scene, queue);
      return queue;
    };
    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    };
    const activateNext = (scene: HTMLElement) => {
      const queue = getQueue(scene);
      if (queue.active || queue.timer || queue.waiting.length === 0) return;
      const next = queue.waiting.shift();
      if (!next) return;
      queue.active = next;
      queue.timer = window.setTimeout(() => {
        queue.timer = null;
        if (isInViewport(next)) {
          next.classList.add("visible");
          syncSceneFocus(next);
        }
        queue.active = null;
        activateNext(scene);
      }, revealStartDelay);
    };
    const removeFromQueue = (element: HTMLElement) => {
      const scene = element.closest<HTMLElement>(".story-scene");
      if (!scene) return;
      const queue = getQueue(scene);
      queue.waiting = queue.waiting.filter((item) => item !== element);
      if (queue.active !== element) return;
      if (queue.timer) window.clearTimeout(queue.timer);
      queue.timer = null;
      queue.active = null;
      activateNext(scene);
    };
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (suspended) return;
        const element = entry.target as HTMLElement;
        const ratio = entry.intersectionRatio;
        const isVisible = element.classList.contains("visible");
        const scene = element.closest<HTMLElement>(".story-scene");

        const isFeaturedPhoto = scene && element.matches(".scene-photo.featured");

        if (!isVisible && isFeaturedPhoto && ratio >= photoRevealEnterThreshold) {
          const queue = getQueue(scene);
          if (!queue.waiting.includes(element) && queue.active !== element) {
            queue.waiting.push(element);
            queue.waiting.sort(
              (a, b) => Number(a.dataset.slot) - Number(b.dataset.slot),
            );
            activateNext(scene);
          }
          return;
        }

        if (!isVisible && !isFeaturedPhoto && entry.isIntersecting) {
          // 챕터·About은 비율이 아니라 화면 진입 여부만 사용한다.
          element.classList.add("visible");
          return;
        }

        if (
          isVisible &&
          ((!isFeaturedPhoto && !entry.isIntersecting) ||
            (isFeaturedPhoto && ratio <= photoRevealResetThreshold))
        ) {
          element.classList.remove("visible");
          syncSceneFocus(element);
        }

        if (!isVisible && ratio < photoRevealEnterThreshold && isFeaturedPhoto) {
          removeFromQueue(element);
        }
      }),
      { threshold: [photoRevealResetThreshold, photoRevealEnterThreshold] },
    );

    const observe = () => {
      root.current?.querySelectorAll(".reveal").forEach(element => observer.observe(element));
    };
    const clearQueues = () => {
      sceneQueues.forEach(queue => {
        if (queue.timer) window.clearTimeout(queue.timer);
      });
      sceneQueues.clear();
    };
    const pause = () => {
      suspended = true;
      observer.disconnect();
      clearQueues();
    };
    const resume = () => {
      suspended = false;
      observe();
    };
    observe();
    const stopObservingActivity = observeTotalSceneActivity(pause, resume);

    return () => {
      observer.disconnect();
      stopObservingActivity();
      root.current?.querySelectorAll<HTMLElement>(".scene-photo.blurred").forEach((photo) => {
        photo.classList.remove("focus-nearby");
      });
      clearQueues();
    };
  }, [category, layoutKey, root]);
}
