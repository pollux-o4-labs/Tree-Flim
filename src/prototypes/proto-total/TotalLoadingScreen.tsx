import { useEffect, useState } from "react";
import useLoadingDisplayProgress from "./useLoadingDisplayProgress";
import type { LoadingPresentation } from "./totalLoadingVisit";
import LoadingTree from "./LoadingTree";
import { siteIdentity } from "../../content/siteIdentity";
import { Text } from '../../content-editor/Content';

type Props = { failed?: number; onRetry?: () => void; presentation: LoadingPresentation; progress: number; onSkip: () => void; exiting: boolean; onExited: () => void };

export default function TotalLoadingScreen({ failed = 0, onRetry, presentation, progress, onSkip, exiting, onExited }: Props) {
  const displayedProgress = useLoadingDisplayProgress(progress, presentation);
  const [foliage, setFoliage] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const flourishing = exiting && progress === 100 && displayedProgress === 100 && !skipped;
  const interrupted = skipped || (exiting && progress < 100);
  const departing = flourishing || interrupted;
  const quickExit = presentation === "brief" || interrupted;
  const duration = interrupted ? 220 : presentation === "brief" ? 420 : 1400;
  const stage = displayedProgress < 35 ? "빛을 모으고 있습니다"
    : displayedProgress < 100 ? "장면에 이야기가 자랍니다"
      : "당신이 머물 장면이 준비되었습니다";

  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (!departing) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      onExited();
      return;
    }
    const started = performance.now();
    const foliageDuration = presentation === "brief" ? 280 : 850;
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - started;
      if (flourishing) setFoliage(Math.min(1, elapsed / foliageDuration));
      if (elapsed >= duration) onExited();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [departing, duration, flourishing, onExited, presentation]);

  return (
    <div className="total-loading" data-phase={flourishing ? "flourishing" : interrupted ? "leaving" : "preparing"} data-presentation={presentation} data-exiting={departing} data-quick-exit={quickExit} aria-label="작품 준비 화면">
      <span className="loading-edition"><Text id="loading.credit">PHOTOGRAPHY BY </Text><Text id="brand.artistNameLatin">{siteIdentity.artistNameLatin}</Text></span>
      <div className="loading-composition">
        <div className="loading-artwork">
          <span className="loading-artwork-note" aria-hidden="true"><Text id="loading.note">빛과 시간의 기록</Text></span>
          <LoadingTree progress={displayedProgress} foliage={foliage} />
          <span className="loading-artwork-index" aria-hidden="true"><Text id="loading.index">a quiet beginning</Text></span>
        </div>
        <h1><Text id="brand.studioName">{siteIdentity.studioName}</Text></h1>
        <p className="loading-poem"><Text id="loading.poem">빛이 머문 자리, 이야기가 자랍니다.</Text></p>
        {failed > 0 && <div className="loading-error" role="alert"><p>사진 {failed}장을 불러오지 못했습니다.</p><button onClick={onRetry}>다시 불러오기</button></div>}
        <p className="loading-status" role="status"><Text id={`loading.stage.${displayedProgress < 35 ? 'start' : displayedProgress < 100 ? 'progress' : 'ready'}`}>{stage}</Text></p>
        <div className="loading-progress" role="progressbar" aria-label="사진 준비" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(displayedProgress)}>
          <span style={{ transform: `scaleX(${displayedProgress / 100})` }} />
        </div>
        <span className="loading-count" aria-hidden="true">{String(Math.round(displayedProgress)).padStart(2, "0")} / 100</span>
      </div>
      <button className="loading-skip" onClick={() => { setSkipped(true); onSkip(); }} disabled={interrupted}><Text id="loading.skip">먼저 둘러보기 </Text><span aria-hidden="true">↗</span></button>
    </div>
  );
}
