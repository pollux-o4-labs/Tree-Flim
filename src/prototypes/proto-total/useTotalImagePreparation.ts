import { useEffect, useState, type RefObject } from 'react';
import { preparePhoto } from './totalPreparedPhotos';

// Prepare the actual rendered page, including offscreen images and content
// overrides. Lazy loading must not leave holes after the entry overlay exits.
export function useTotalImagePreparation(root: RefObject<HTMLElement | null>, ready: boolean, enabled = true) {
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled || !ready || finished || !root.current) return;
    let active = true;
    let generation = 0;
    let previous = '';
    let frame = 0;
    const scan = () => {
      const images = [...root.current!.querySelectorAll<HTMLImageElement>('.total-content img')];
      const sources = [...new Set(images.map(image => image.currentSrc || image.src).filter(Boolean))];
      const key = JSON.stringify(sources);
      if (key === previous) return;
      previous = key;
      const current = ++generation;
      let complete = 0;
      setFailed(0);
      setProgress(0);
      // Start every image in the scrolling page while the overlay is present.
      images.forEach(image => {
        image.loading = 'eager';
        if (attempt > 0 && image.complete && !image.naturalWidth) image.src = image.src;
      });
      const requests = sources.map(async src => {
        await preparePhoto({ id: src, src, story: '', category: '' });
        await Promise.all(images.filter(image => (image.currentSrc || image.src) === src).map(image => image.decode()));
        complete++;
        if (active && current === generation) setProgress(Math.round(complete / sources.length * 100));
      });
      void Promise.all([Promise.allSettled(requests), document.fonts.ready]).then(([results]) => {
        if (!active || current !== generation) return;
        const errors = results.filter(result => result.status === 'rejected').length;
        if (errors) { setFailed(errors); return; }
        // Allow published news and responsive layout changes to settle too.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (active && current === generation) { setProgress(100); setFinished(true); }
          });
        });
      });
    };
    const observer = new MutationObserver(scan);
    observer.observe(root.current, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
    scan();
    return () => { active = false; observer.disconnect(); cancelAnimationFrame(frame); };
  }, [root, ready, enabled, finished, attempt]);
  return { loading: enabled && !finished, progress, failed,
    retry: () => { setFailed(0); setAttempt(n => n + 1); },
    skip: () => setFinished(true) };
}
