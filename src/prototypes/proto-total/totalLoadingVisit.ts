export type LoadingPresentation = "intro" | "brief";
const seenKey = "tree-film:intro-seen:v1";
let seenInMemory = false;

export function getLoadingPresentation(category: string | null): LoadingPresentation {
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (category || seenInMemory || navigation?.type === "reload" || navigation?.type === "back_forward") return "brief";
  try {
    if (localStorage.getItem(seenKey) === "1") return "brief";
  } catch { /* Storage restrictions must not prevent entry. */ }
  return "intro";
}

export function rememberLoadingVisit() {
  seenInMemory = true;
  try { localStorage.setItem(seenKey, "1"); } catch { /* The current document still remembers the visit. */ }
}
