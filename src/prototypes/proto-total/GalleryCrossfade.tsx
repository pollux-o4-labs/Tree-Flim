import { useLayoutEffect, useRef, type ReactNode } from "react";

export const GALLERY_CROSSFADE_DURATION = 560;

/** Keep a non-interactive visual snapshot while the live content dissolves in. */
export default function GalleryCrossfade({ identity, children }: { identity: string; children: ReactNode }) {
  const live = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const snapshot = useRef<HTMLElement | null>(null);
  const previousIdentity = useRef(identity);

  useLayoutEffect(() => {
    const element = live.current;
    const layer = overlay.current;
    if (!element || !layer) return;
    const changed = previousIdentity.current !== identity;
    previousIdentity.current = identity;
    let animation: Animation | undefined;
    if (changed && snapshot.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      layer.replaceChildren(snapshot.current);
      const timing = { duration: GALLERY_CROSSFADE_DURATION, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "both" as const };
      // The old surface stays beneath the incoming one, avoiding a blank frame.
      animation = element.animate([{ opacity: 0 }, { opacity: 1 }], timing);
      const outgoing = layer.animate([{ opacity: 1 }, { opacity: 0 }], timing);
      outgoing.finished.then(() => layer.replaceChildren()).catch(() => {});
    }
    snapshot.current = element.cloneNode(true) as HTMLElement;
    return () => {
      animation?.cancel();
      layer.getAnimations().forEach(item => item.cancel());
      layer.replaceChildren();
    };
  }, [identity]);

  // Refresh the snapshot as pagination and image preparation update the live view.
  useLayoutEffect(() => {
    if (live.current) snapshot.current = live.current.cloneNode(true) as HTMLElement;
  });

  return <div className="gallery-crossfade">
    <div className="gallery-previous" ref={overlay} aria-hidden="true" inert />
    <div className="gallery-current" ref={live}>{children}</div>
  </div>;
}
