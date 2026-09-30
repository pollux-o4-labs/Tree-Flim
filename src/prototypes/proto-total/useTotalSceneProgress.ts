import type { RefObject } from "react";
import { useTotalAutoTransitionProgress } from "./useTotalAutoTransitionProgress";
import { useTotalRevealProgress } from "./useTotalRevealProgress";
import { useTotalSceneMotion } from "./useTotalSceneMotion";

export function useTotalSceneProgress(
  root: RefObject<HTMLDivElement | null>,
  transition: RefObject<HTMLElement | null>,
  category: string | null,
  layoutKey: number | string,
) {
  useTotalAutoTransitionProgress({ transition, category });
  useTotalRevealProgress(root, category, layoutKey);
  useTotalSceneMotion(root, category, layoutKey);
}
