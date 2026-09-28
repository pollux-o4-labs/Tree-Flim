let navigationToken = 0;
let navigationFrame = 0;

export function scrollToSectionSafely(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  const token = ++navigationToken;
  cancelAnimationFrame(navigationFrame);

  window.dispatchEvent(
    new CustomEvent("safe-section-navigation-start", {
      detail: { id, token },
    }),
  );

  const target = Math.max(
    0,
    section.getBoundingClientRect().top + window.scrollY,
  );
  window.scrollTo({ top: target, left: 0, behavior: "smooth" });

  // Native smooth scrolling does not consistently expose a completion event
  // across browsers. Poll the actual position so sticky sections can start
  // their narrative only after the viewport has truly settled.
  const startedAt = performance.now();
  const waitForSettledPosition = (now: number) => {
    if (token !== navigationToken) return;
    const settled = Math.abs(window.scrollY - target) < 2;
    if (settled || now - startedAt > 1800) {
      window.dispatchEvent(
        new CustomEvent("safe-section-navigation-end", {
          detail: { id, token },
        }),
      );
      return;
    }
    navigationFrame = requestAnimationFrame(waitForSettledPosition);
  };
  navigationFrame = requestAnimationFrame(waitForSettledPosition);
}
