import { useEffect, type RefObject } from "react";
import { observeTotalSceneActivity } from "./totalSceneActivity";

const sceneTranslateSpeed = 130;
const featuredMovementScale = 0.8;

type SceneOffset = { current: number; target: number };

const moveTowards = (current: number, target: number, distance: number) => {
  if (Math.abs(target - current) <= distance) return target;
  return current + Math.sign(target - current) * distance;
};

export function useTotalSceneMotion(
  root: RefObject<HTMLDivElement | null>,
  category: string | null,
  layoutKey: number,
) {
  useEffect(() => {
    if (category) return;
    let suspended = false;
    let frame = 0;
    let motionFrame = 0;
    let previousMotionTime = 0;
    const sceneOffsets = new Map<HTMLElement, SceneOffset>();
    const scenes = Array.from(root.current?.querySelectorAll<HTMLElement>(".story-scene") ?? []).map((element) => ({
      element,
      photos: Array.from(element.querySelectorAll<HTMLElement>(".scene-photo")),
    }));

    const animateSceneOffsets = (now: number) => {
      const delta = Math.min(50, previousMotionTime ? now - previousMotionTime : 16) / 1000;
      previousMotionTime = now;
      let moving = false;

      sceneOffsets.forEach((state, element) => {
        if (state.current === state.target) return;
        state.current = moveTowards(
          state.current,
          state.target,
          sceneTranslateSpeed * delta,
        );
        element.style.setProperty("--scene-translate-y", `${state.current}px`);
        moving ||= state.current !== state.target;
      });

      if (moving) {
        motionFrame = requestAnimationFrame(animateSceneOffsets);
      } else {
        motionFrame = 0;
        previousMotionTime = 0;
      }
    };

    const update = () => {
      frame = 0;
      // Read all geometry before writing styles; only animate scenes near the viewport.
      const measured = scenes.map((scene) => ({ ...scene, rect: scene.element.getBoundingClientRect() }));
      measured.forEach(({ photos, rect }) => {
        if (rect.bottom < -100 || rect.top > innerHeight + 100) {
          photos.forEach((photo) => sceneOffsets.delete(photo));
          return;
        }
        const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        photos.forEach((photo) => {
          const movementScale = photo.classList.contains("featured") ? featuredMovementScale : 1;
          const target = (0.5 - progress) * 130 * movementScale;
          const existing = sceneOffsets.get(photo);
          if (existing) {
            existing.target = target;
          } else {
            // Continue from the displayed position after a fling or viewport reentry.
            const current = parseFloat(photo.style.getPropertyValue("--scene-translate-y")) || 0;
            sceneOffsets.set(photo, { current, target });
          }
        });
      });

      if (!motionFrame) motionFrame = requestAnimationFrame(animateSceneOffsets);
    };

    const onScroll = () => {
      if (!suspended && !frame) frame = requestAnimationFrame(update);
    };

    const pause = () => {
      suspended = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(motionFrame);
      frame = motionFrame = previousMotionTime = 0;
      sceneOffsets.clear();
    };
    const resume = () => {
      suspended = false;
      onScroll();
    };

    update();
    const stopObservingActivity = observeTotalSceneActivity(pause, resume);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(motionFrame);
      sceneOffsets.clear();
      stopObservingActivity();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root, category, layoutKey]);
}
