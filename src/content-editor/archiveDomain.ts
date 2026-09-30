import type { ArchiveWork, RecordStatus } from "./model";
import type { PublicDriveItem } from "./publicDrive";

const stamp = () => new Date().toISOString();

export function newArchiveWork(): ArchiveWork {
  const now = stamp();
  return {
    id: `work-${crypto.randomUUID()}`,
    title: "제목 없는 작품",
    category: "미분류",
    image: "",
    note: "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function patchArchiveWork(
  works: ArchiveWork[],
  id: string,
  patch: Partial<ArchiveWork>,
) {
  return works.map((work) =>
    work.id === id ? { ...work, ...patch, updatedAt: stamp() } : work,
  );
}
export function patchSelectedWorks(
  works: ArchiveWork[],
  ids: Set<string>,
  patch: Partial<ArchiveWork>,
) {
  return works.map((work) =>
    ids.has(work.id) ? { ...work, ...patch, updatedAt: stamp() } : work,
  );
}
export function removeArchiveCategory(works: ArchiveWork[], category: string) {
  return works.map((work) =>
    work.category === category
      ? { ...work, category: "미분류", updatedAt: stamp() }
      : work,
  );
}
export function renameArchiveCategory(
  works: ArchiveWork[],
  category: string,
  nextCategory: string,
) {
  return works.map((work) =>
    work.category === category
      ? { ...work, category: nextCategory, updatedAt: stamp() }
      : work,
  );
}
export function reorderArchiveWorks(
  works: ArchiveWork[],
  sourceId: string,
  targetId: string,
) {
  const from = works.findIndex((work) => work.id === sourceId),
    to = works.findIndex((work) => work.id === targetId);
  if (from < 0 || to < 0 || from === to) return works;
  const next = [...works],
    [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
export function archiveWorksFromDrive(
  items: PublicDriveItem[],
  category: string,
) {
  const now = stamp();
  return items
    .filter((item) => item.sourceUrl)
    .map((item) => ({
      id: `work-${crypto.randomUUID()}`,
      title: item.name.replace(/\.[^.]+$/, ""),
      category: category.trim() || "미분류",
      image: item.sourceUrl!,
      note: "",
      status: "draft" as RecordStatus,
      createdAt: now,
      updatedAt: now,
    }));
}
