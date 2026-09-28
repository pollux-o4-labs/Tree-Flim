let navigationToken = 0;
let cancelNavigation: (() => void) | undefined;

export function cancelTotalSectionNavigation() {
  cancelNavigation?.();
}

export function totalScrollToSectionSafely(id: string) {
  cancelTotalSectionNavigation();
  const section = document.getElementById(id);
  if (!section) return;
  const token = ++navigationToken;
  let frame = 0;
  let finished = false;
  const finish = (cancelled: boolean) => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", onKey);
    cancelNavigation = undefined;
    if (cancelled) window.scrollTo({ top: window.scrollY, behavior: "instant" });
    window.dispatchEvent(new CustomEvent("safe-section-navigation-end", { detail: { id, token, cancelled } }));
  };
  const cancel = () => finish(true);
  const onKey = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape"].includes(event.key)) cancel();
  };
  cancelNavigation = cancel;
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.dispatchEvent(new CustomEvent("safe-section-navigation-start", { detail: { id, token } }));
  const target = Math.min(
    Math.max(0, section.getBoundingClientRect().top + window.scrollY),
    Math.max(0, document.documentElement.scrollHeight - innerHeight),
  );
  window.scrollTo({ top: target, left: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  const startedAt = performance.now();
  const waitForSettledPosition = (now: number) => {
    if (!section.isConnected) { finish(true); return; }
    if (Math.abs(window.scrollY - target) < 2) { finish(false); return; }
    if (now - startedAt > 1800) { finish(true); return; }
    frame = requestAnimationFrame(waitForSettledPosition);
  };
  frame = requestAnimationFrame(waitForSettledPosition);
}
