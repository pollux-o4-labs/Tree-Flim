import { useEffect } from "react";

type SmoothWheelScrollOptions = {
  disabled?: boolean;
  getWheelMultiplier?: (event: WheelEvent) => number;
};

const scrollConfig = {
  stiffness: 100,
  baseMaxVelocity: 1200,
  peakMaxVelocity: 4800,
  baseWheelMultiplier: 0.2,
  maxWheelMultiplier: 2,
  burstThreshold: 10,
  burstWindow: 180,
  extensionRatio: 0.2,
  extensionViewportCap: 0.4,
  slowCurveExponent: 1.2,
  slowProgressLimit: 0.7,
  maxFrameDelta: 50,
  settleDistance: 0.5,
  settleVelocity: 0.5,
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function useSmoothWheelScroll({
  disabled = false,
  getWheelMultiplier,
}: SmoothWheelScrollOptions = {}) {
  useEffect(() => {
    if (disabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = window.scrollY;
    let target = current;
    let frame = 0;
    let previousTime = 0;
    let animating = false;
    let velocity = 0;
    let inputDirection = 0;
    let inputBurst = 0;
    let lastInputAt = 0;
    let idleTimer = 0;
    let gestureDistance = 0;
    let extensionApplied = false;
    let maxVelocity: number = scrollConfig.baseMaxVelocity;
    let narrativeScrollLocked = false;

    const damping = 2 * Math.sqrt(scrollConfig.stiffness);
    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const clampScroll = (value: number) => clamp(value, 0, maxScroll());
    const resetGesture = () => {
      inputDirection = 0;
      inputBurst = 0;
      gestureDistance = 0;
      extensionApplied = false;
      maxVelocity = scrollConfig.baseMaxVelocity;
    };
    const discardPendingScroll = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      current = window.scrollY;
      target = current;
      previousTime = 0;
      animating = false;
      velocity = 0;
      window.clearTimeout(idleTimer);
      idleTimer = 0;
      resetGesture();
    };
    const isBlocked = (event: WheelEvent) => {
      const element = event.target instanceof HTMLElement ? event.target : null;
      return Boolean(
        element?.closest(
          "dialog[open], input, textarea, select, [contenteditable]",
        ),
      );
    };
    const getWheelUnit = (event: WheelEvent) =>
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const getBurstProgress = () => {
      const slowBurstEnd = scrollConfig.burstThreshold - 1;
      const slowProgress = clamp(
        (inputBurst - 1) / (slowBurstEnd - 1),
        0,
        1,
      );
      const exponentialProgress =
        (Math.exp(scrollConfig.slowCurveExponent * slowProgress) - 1) /
        (Math.exp(scrollConfig.slowCurveExponent) - 1);

      return inputBurst < scrollConfig.burstThreshold
        ? exponentialProgress * scrollConfig.slowProgressLimit
        : 1;
    };
    const animate = (now: number) => {
      const deltaTime =
        (previousTime
          ? Math.min(scrollConfig.maxFrameDelta, now - previousTime)
          : 16) / 1000;
      previousTime = now;
      const distance = target - current;
      const acceleration =
        distance * scrollConfig.stiffness - velocity * damping;
      velocity = clamp(
        velocity + acceleration * deltaTime,
        -maxVelocity,
        maxVelocity,
      );
      current += velocity * deltaTime;
      window.scrollTo({ top: current, left: 0, behavior: "instant" });

      if (
        Math.abs(target - current) > scrollConfig.settleDistance ||
        Math.abs(velocity) > scrollConfig.settleVelocity
      ) {
        frame = requestAnimationFrame(animate);
        return;
      }

      current = target;
      velocity = 0;
      window.scrollTo({ top: target, left: 0, behavior: "instant" });
      frame = 0;
      previousTime = 0;
      animating = false;
      resetGesture();
    };
    const extendGesture = () => {
      idleTimer = 0;
      if (
        inputBurst < scrollConfig.burstThreshold ||
        extensionApplied ||
        !inputDirection
      ) {
        return;
      }

      const extension = Math.min(
        gestureDistance * scrollConfig.extensionRatio,
        innerHeight * scrollConfig.extensionViewportCap,
      );
      if (extension < 1) return;

      target = clampScroll(target + inputDirection * extension);
      extensionApplied = true;
      animating = true;
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const onWheel = (event: WheelEvent) => {
      if (narrativeScrollLocked) {
        if (event.cancelable) event.preventDefault();
        discardPendingScroll();
        return;
      }
      if (!event.deltaY || isBlocked(event)) return;
      event.preventDefault();

      if (!animating) {
        current = window.scrollY;
        target = current;
        animating = true;
      }

      const inputDistance = event.deltaY * getWheelUnit(event);
      const nextDirection = Math.sign(inputDistance);
      if (inputDirection && nextDirection !== inputDirection) {
        target = current;
        velocity = 0;
        previousTime = 0;
        inputBurst = 0;
      }
      inputDirection = nextDirection;

      const now = performance.now();
      if (now - lastInputAt > scrollConfig.burstWindow) {
        inputBurst = 0;
        gestureDistance = 0;
        extensionApplied = false;
        maxVelocity = scrollConfig.baseMaxVelocity;
      }
      inputBurst = Math.min(scrollConfig.burstThreshold, inputBurst + 1);
      lastInputAt = now;

      const burstProgress = getBurstProgress();
      maxVelocity = clamp(
        scrollConfig.baseMaxVelocity +
          (scrollConfig.peakMaxVelocity - scrollConfig.baseMaxVelocity) *
            burstProgress,
        scrollConfig.baseMaxVelocity,
        scrollConfig.peakMaxVelocity,
      );
      const wheelMultiplier =
        scrollConfig.baseWheelMultiplier +
        (scrollConfig.maxWheelMultiplier - scrollConfig.baseWheelMultiplier) *
          burstProgress;
      const sceneMultiplier = clamp(getWheelMultiplier?.(event) ?? 1, 0.05, 1);
      const appliedDistance = inputDistance * wheelMultiplier * sceneMultiplier;
      gestureDistance += Math.abs(appliedDistance);
      target = clampScroll(target + appliedDistance);

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(
        extendGesture,
        scrollConfig.burstWindow,
      );
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const onScroll = () => {
      if (!animating) current = target = window.scrollY;
    };
    const onResize = () => {
      target = clampScroll(target);
      current = clampScroll(current);
    };
    const onNarrativeScrollLock = (event: Event) => {
      const locked = Boolean(
        (event as CustomEvent<{ locked?: boolean }>).detail?.locked,
      );
      narrativeScrollLocked = locked;
      discardPendingScroll();
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!narrativeScrollLocked) return;
      if (event.cancelable) event.preventDefault();
      discardPendingScroll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!narrativeScrollLocked) return;
      const element = event.target instanceof HTMLElement ? event.target : null;
      if (element?.closest("dialog[open], input, textarea, select, [contenteditable]")) {
        return;
      }
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        discardPendingScroll();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("narrative-scroll-lock", onNarrativeScrollLock);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("narrative-scroll-lock", onNarrativeScrollLock);
    };
  }, [disabled]);
}
