// Only explicit menu travel suspends intermediate scene effects.
// Direct scrolling must respond immediately, including fast touch gestures.
export function observeTotalSceneActivity(pause: () => void, resume: () => void) {
  window.addEventListener("safe-section-navigation-start", pause);
  window.addEventListener("safe-section-navigation-end", resume);
  return () => {
    window.removeEventListener("safe-section-navigation-start", pause);
    window.removeEventListener("safe-section-navigation-end", resume);
  };
}
