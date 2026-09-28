import { useEffect, useState } from "react";
import { concepts } from "../../content/prototype-fixture";
import { preparePhoto } from "./totalPreparedPhotos";
import { TOTAL_GALLERY_PAGE_SIZE } from "./totalTypes";

const prepared = new Set<string>();
const allPhotos = concepts.flatMap((concept) => concept.photos);
const allSources = [...new Set(allPhotos.map((photo) => photo.src))];

function getEntrySources(category: string | null) {
  if (category === null) {
    return allSources;
  }
  if (category === "all") {
    return allSources.slice(0, TOTAL_GALLERY_PAGE_SIZE);
  }
  const entry = concepts.find((concept) => concept.id === category);
  return [...new Set(entry?.photos.map((photo) => photo.src) ?? allSources)].slice(0, TOTAL_GALLERY_PAGE_SIZE);
}

export function useTotalImagePreparation(category: string | null, enabled = true) {
  const entrySources = getEntrySources(category);
  const [loading, setLoading] = useState(() => enabled && entrySources.some((src) => !prepared.has(src)));
  const [completed, setCompleted] = useState(() => entrySources.filter((src) => prepared.has(src)).length);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    // The home view still prepares all selected scenes. The archive prepares only
    // its first visible batch; later batches keep the same scroll-loading path.
    const sources = getEntrySources(category);
    const deadline = window.setTimeout(() => { if (active) setLoading(false); }, 6000);
    const requests = sources.map(async (src) => {
      if (prepared.has(src)) return;
      try {
        await preparePhoto(allPhotos.find((photo) => photo.src === src)!);
        prepared.add(src);
        if (active) setCompleted(sources.filter((entrySource) => prepared.has(entrySource)).length);
      } catch {
        // An unavailable photograph must never block entry to the portfolio.
      }
    });
    void Promise.allSettled([...requests, document.fonts.ready]).then(() => {
      window.clearTimeout(deadline);
      if (active) setLoading(false);
    });
    return () => { active = false; window.clearTimeout(deadline); };
    // Preparation runs once per visit. The archive shares the same photographs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, progress: Math.round(completed / entrySources.length * 100), skip: () => setLoading(false) };
}
