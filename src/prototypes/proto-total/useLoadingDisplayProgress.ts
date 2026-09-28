import { useEffect, useRef, useState } from "react";
import type { LoadingPresentation } from "./totalLoadingVisit";

export default function useLoadingDisplayProgress(progress: number, presentation: LoadingPresentation) {
  const [displayed, setDisplayed] = useState(0);
  const current = useRef(0);
  const target = useRef(0);
  const completion = useRef<{ from: number; at: number } | null>(null);

  useEffect(() => {
    target.current = Math.max(target.current, Math.min(100, progress));
    if (target.current === 100 && !completion.current) {
      completion.current = { from: current.current, at: performance.now() };
    }
  }, [progress]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(50, now - previous) / 1000;
      previous = now;
      let next = current.current;
      if (media.matches) {
        next = target.current;
      } else if (completion.current) {
        // Finish preparing the sparse tree. Foliage has its own timeline afterward.
        const t = Math.min(1, (now - completion.current.at) / (presentation === "intro" ? 700 : 180));
        const eased = t * t * (3 - 2 * t);
        next = Math.max(next, completion.current.from + (100 - completion.current.from) * eased);
      } else {
        next += (target.current - next) * (1 - Math.exp(-8 * delta));
        if (target.current - next < .01) next = target.current;
      }
      if (next !== current.current) {
        current.current = next;
        setDisplayed(next);
      }
      if (next < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [presentation]);

  return displayed;
}
