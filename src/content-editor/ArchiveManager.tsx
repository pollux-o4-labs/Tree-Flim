import ArchiveHeader from './ArchiveHeader';
import PreviewImage from '../shared/PreviewImage';
import { useUnsavedNavigation } from './useUnsavedNavigation';
import { Link } from 'react-router-dom';
import ArchiveNavigation from './ArchiveNavigation';
import './story-manager.css';
import { initialArchiveWorks } from './archiveContent';
import {
  Archive,
  Check,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Eye,
  FolderOpen,
  GripVertical,
  ImagePlus,
  Info,
  LayoutGrid,
  Maximize2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { concepts } from "../content/prototype-fixture";
import ArchiveCollectionList from "./ArchiveCollectionList";
import ArchiveCollectionNameForm from "./ArchiveCollectionNameForm";
import ArchiveDrivePicker from "./ArchiveDrivePicker";
import {
  archiveWorksFromDrive,
  newArchiveWork,
  patchArchiveWork,
  patchSelectedWorks,
  removeArchiveCategory,
  renameArchiveCategory,
  reorderArchiveWorks,
} from "./archiveDomain";
import type { ArchiveWork, RecordStatus, Workspace } from "./model";
import type { PublicDriveItem } from "./publicDrive";
import { readWorkspace, writeWorkspace, getCachedWorkspace } from "./repository";
import "./archive-manager.css";
import "./archive-responsive.css";

const statusLabel: Record<RecordStatus, string> = {
  draft: "초안",
  published: "공개",
  archived: "숨김",
  trashed: "휴지통",
};
const initial = initialArchiveWorks;
const collectionWidthBounds = { min: 220, max: 340 };

function clampCollectionWidth(width: number) {
  return Math.min(collectionWidthBounds.max, Math.max(collectionWidthBounds.min, width));
}

export default function ArchiveManager() {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const photoPreviewRef = useRef<HTMLDialogElement>(null);
  const [mobileCollectionSorting, setMobileCollectionSorting] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(getCachedWorkspace),
    [works, setWorks] = useState<ArchiveWork[]>(() => getCachedWorkspace()?.archiveDraft ?? initial),
    [archiveCategories, setArchiveCategories] = useState<string[]>(() => getCachedWorkspace()?.archiveCategories ?? [...new Set((getCachedWorkspace()?.archiveDraft ?? initial).map(work => work.category))]),
    [selectedId, setSelectedId] = useState(""),
    [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()),
    [category, setCategory] = useState("전체"),
    [status, setStatus] = useState<RecordStatus | "all">("all"),
    [query, setQuery] = useState(""),
    [editorOpen, setEditorOpen] = useState(false),
    [collectionsCollapsed, setCollectionsCollapsed] = useState(false),
    [collectionWidth, setCollectionWidth] = useState<number | null>(null),
    [resizingCollections, setResizingCollections] = useState(false),
    [reorderMode, setReorderMode] = useState(false),
    [gridLarge, setGridLarge] = useState(false),
    [batchCategory, setBatchCategory] = useState(""),
    [draggedId, setDraggedId] = useState(""),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [undoSnapshot, setUndoSnapshot] = useState<ArchiveWork[] | null>(null),
    [driveOpen, setDriveOpen] = useState(false),
    [addingCategory, setAddingCategory] = useState(false),
    [newCategoryName, setNewCategoryName] = useState(""),
    [renamingCategory, setRenamingCategory] = useState(false),
    [renamedCategoryName, setRenamedCategoryName] = useState(""),
    [deleteConfirmation, setDeleteConfirmation] = useState(""),
    [addMenuOpen, setAddMenuOpen] = useState(false);
  useEffect(() => {
    void readWorkspace()
      .then((value) => {
        const next = value.archiveDraft ?? initial;
        setWorkspace(value);
        setWorks(next);
        const requested = new URLSearchParams(location.search).get('work');
        if (requested && next.some(work => work.id === requested)) { setSelectedId(requested); setEditorOpen(true); }
        setArchiveCategories(
          value.archiveCategories ?? [
            ...new Set(next.map((work) => work.category)),
          ],
        );
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "아카이브를 불러오지 못했습니다.",
        ),
      );
  }, []);
  const selected = works.find((work) => work.id === selectedId),
    categories = useMemo(
      () => [
        "전체",
        ...new Set([
          ...archiveCategories,
          ...works.map((work) => work.category),
        ]),
      ],
      [archiveCategories, works],
    ),
    visible = useMemo(
      () =>
        works.filter(
          (work) =>
            (category === "전체" || work.category === category) &&
            (status === "all"
              ? work.status !== "trashed"
              : work.status === status) &&
            `${work.title} ${work.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        ),
      [works, category, status, query],
    ),
    dirty = workspace
      ? JSON.stringify(works) !==
        JSON.stringify(
          workspace.archiveDraft ?? initial,
        )
      : false,
    categoriesDirty = workspace
      ? JSON.stringify(archiveCategories) !==
        JSON.stringify(
          workspace.archiveCategories ?? [
            ...new Set(
              (workspace.archiveDraft ?? initial).map(
                (work) => work.category,
              ),
            ),
          ],
        )
      : false,
    selectedWorks = works.filter((work) => selectedIds.has(work.id)),
    selectedPrivateCount = selectedWorks.filter(
      (work) => work.status !== "published",
    ).length,
    trashedCount = works.filter((work) => work.status === "trashed").length,
    visibleSelectedCount = visible.filter((work) =>
      selectedIds.has(work.id),
    ).length,
    allVisibleSelected =
      visible.length > 0 && visibleSelectedCount === visible.length;
  const navigateAfterSave = useUnsavedNavigation(dirty || categoriesDirty);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || categoriesDirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, categoriesDirty]);
  useEffect(() => {
    const dialog = photoPreviewRef.current;
    if (photoPreviewOpen && dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, [photoPreviewOpen]);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        visibleSelectedCount > 0 && !allVisibleSelected;
    }
  }, [allVisibleSelected, visibleSelectedCount]);
  useEffect(() => {
    if (!addMenuOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [addMenuOpen]);
  useEffect(() => {
    // A successful save is confirmation, not a task. Keep undoable changes
    // available longer, but never let either message cover the work surface.
    if (!message || error) return;
    const timeout = window.setTimeout(
      () => {
        setMessage("");
        if (undoSnapshot) setUndoSnapshot(null);
      },
      undoSnapshot ? 8000 : 4000,
    );
    return () => window.clearTimeout(timeout);
  }, [error, message, undoSnapshot]);
  useEffect(() => {
    setRenamingCategory(false);
    setRenamedCategoryName("");
  }, [category, status]);
  function replace(next: ArchiveWork[], feedback = "") {
    setWorks(next);
    setMessage(feedback);
    setError("");
  }
  function update(patch: Partial<ArchiveWork>) {
    if (selected) replace(patchArchiveWork(works, selected.id, patch));
  }
  async function persist(
    next = works,
    publish = false,
    success = "초안을 저장했습니다. 방문객에게는 아직 보이지 않습니다.",
    nextCategories = archiveCategories,
    publication?: ArchiveWork[],
  ) {
    if (!workspace || saving) return false;
    setSaving(true);
    setError("");
    try {
      const saved = await writeWorkspace({
        ...workspace,
        archiveDraft: next,
        archiveCategories: nextCategories,
        ...(publish
          ? {
              archivePublished: publication ?? next.filter(
                (work) => work.status === "published",
              ),
            }
          : {}),
      });
      setWorkspace(saved);
      setWorks(saved.archiveDraft ?? next);
      setArchiveCategories(nextCategories);
      setMessage(success);
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "저장하지 못했습니다.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name || categories.includes(name)) return;
    const nextCategories = [...archiveCategories, name];
    await persist(
      works,
      false,
      `“${name}” 컬렉션을 만들고 저장했습니다.`,
      nextCategories,
    );
    setCategory(name);
    setStatus("all");
    setNewCategoryName("");
    setAddingCategory(false);
  }
  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    if (allVisibleSelected) {
      const next = new Set(selectedIds);
      visible.forEach((work) => next.delete(work.id));
      setSelectedIds(next);
      return;
    }
    setSelectedIds(
      new Set([...selectedIds, ...visible.map((work) => work.id)]),
    );
    setReorderMode(false);
  }
  function clearSelection() {
    setSelectedIds(new Set());
    setDeleteConfirmation("");
  }
  function editWork(id: string) {
    clearSelection();
    setSelectedId(id);
    setDeleteConfirmation("");
    setEditorOpen(true);
  }
  function toggleTrashView() {
    clearSelection();
    const openingTrash = status !== "trashed";
    setStatus(openingTrash ? "trashed" : "all");
    if (openingTrash) setCategory("전체");
    setEditorOpen(false);
  }
  function resizeCollections(event: ReactPointerEvent<HTMLDivElement>) {
    if (collectionsCollapsed) return;
    event.preventDefault();
    setResizingCollections(true);
    const startX = event.clientX;
    const startWidth = collectionWidth ?? 248;
    const updateWidth = (moveEvent: PointerEvent) =>
      setCollectionWidth(
        clampCollectionWidth(startWidth + moveEvent.clientX - startX),
      );
    const finishResize = () => {
      window.removeEventListener("pointermove", updateWidth);
      window.removeEventListener("pointerup", finishResize);
      setResizingCollections(false);
    };
    window.addEventListener("pointermove", updateWidth);
    window.addEventListener("pointerup", finishResize, { once: true });
  }
  function create() {
    const next = newArchiveWork();
    replace([next, ...works]);
    setSelectedId(next.id);
    setEditorOpen(true);
  }
  async function applyBatchCategory() {
    if (!batchCategory.trim() || !selectedIds.size) return;
    setUndoSnapshot(works);
    const count = selectedIds.size;
    const next = patchSelectedWorks(works, selectedIds, {
      category: batchCategory.trim(),
    });
    await persist(
      next,
      true,
      `${count}장을 “${batchCategory.trim()}” 컬렉션으로 옮기고 저장했습니다.`,
    );
    clearSelection();
  }
  async function trashSelected() {
    if (!selectedIds.size) return;
    setUndoSnapshot(works);
    const count = selectedIds.size;
    const next = patchSelectedWorks(works, selectedIds, { status: "trashed" });
    await persist(
      next,
      true,
      `${count}장을 휴지통으로 옮기고 저장했습니다.`,
    );
    clearSelection();
  }
  async function restoreSelected() {
    if (!selectedIds.size) return;
    const count = selectedIds.size;
    const next = patchSelectedWorks(works, selectedIds, { status: "draft" });
    await persist(
      next,
      true,
      `${count}장을 초안으로 복원해 저장했습니다.`,
    );
    clearSelection();
  }
  async function deleteSelectedPermanently() {
    if (!selectedIds.size) return;
    if (deleteConfirmation !== "batch") {
      setDeleteConfirmation("batch");
      return;
    }
    const count = selectedIds.size;
    const next = works.filter((work) => !selectedIds.has(work.id));
    setUndoSnapshot(null);
    await persist(
      next,
      true,
      `${count}장을 영구 삭제했습니다.`,
    );
    clearSelection();
  }
  async function deleteWorkPermanently(id: string) {
    if (deleteConfirmation !== id) {
      setDeleteConfirmation(id);
      return;
    }
    const next = works.filter((work) => work.id !== id);
    setUndoSnapshot(null);
    await persist(next, true, "사진을 영구 삭제했습니다.");
    setSelectedId("");
    setEditorOpen(false);
    setDeleteConfirmation("");
  }
  async function publishSelected() {
    if (!selectedIds.size || !selectedPrivateCount) return;
    setUndoSnapshot(works);
    const count = selectedPrivateCount;
    const next = patchSelectedWorks(works, selectedIds, {
      status: "published",
    });
    await persist(
      next,
      true,
      `${count}장을 사이트에 공개했습니다. 방문객 화면에 반영됐습니다.`,
    );
    clearSelection();
  }
  function moveTo(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = reorderArchiveWorks(works, draggedId, targetId);
    if (next === works) return;
    setUndoSnapshot(works);
    void persist(next, true, "사진 순서를 바꾸고 저장했습니다.");
    setDraggedId("");
  }
  async function removeCategory(removed: string) {
    setUndoSnapshot(works);
    const next = removeArchiveCategory(works, removed);
    const nextCategories = archiveCategories.filter(
      (item) => item !== removed,
    );
    await persist(
      next,
      true,
      `“${removed}” 컬렉션을 없애고 사진을 미분류로 옮겨 저장했습니다.`,
      nextCategories,
    );
    setCategory("전체");
    setEditorOpen(false);
  }
  async function saveCollectionOrder(order: string[]) {
    if (!workspace || saving) return false;
    setSaving(true);
    try {
      const saved = await writeWorkspace({ ...workspace, archiveCategories: order });
      setWorkspace(saved);
      setArchiveCategories(order);
      setMessage("컬렉션 순서를 저장했습니다.");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "순서를 저장하지 못했습니다.");
      return false;
    } finally { setSaving(false); }
  }
  async function renameCategory() {
    const name = renamedCategoryName.trim();
    if (!name || name === category || categories.includes(name)) return;
    setUndoSnapshot(works);
    const next = renameArchiveCategory(works, category, name);
    const nextCategories = archiveCategories.map((item) =>
      item === category ? name : item,
    );
    const saved = await persist(
      next,
      true,
      `컬렉션 이름을 “${name}”으로 바꾸고 저장했습니다.`,
      nextCategories,
    );
    if (!saved) return;
    setCategory(name);
    setRenamedCategoryName("");
    setRenamingCategory(false);
  }
  async function undoLast() {
    if (!undoSnapshot) return;
    await persist(
      undoSnapshot,
      true,
      "방금 작업을 되돌리고 저장했습니다.",
    );
    setUndoSnapshot(null);
  }
  async function changeStatus(nextStatus: RecordStatus) {
    if (!selected) return;
    const next = patchArchiveWork(works, selected.id, { status: nextStatus });
    await persist(
      next,
      true,
      nextStatus === "published"
        ? "작품을 공개했습니다. 방문객 갤러리에 표시됩니다."
        : nextStatus === "trashed"
          ? "휴지통으로 옮겼습니다. 필요하면 복원할 수 있습니다."
          : nextStatus === "archived"
            ? "작품을 숨겼습니다. 방문객에게는 보이지 않습니다."
            : "초안으로 복원했습니다.",
    );
    if (nextStatus === "trashed" || status === "trashed") {
      setEditorOpen(false);
    }
  }
  async function importDriveSelection(
    picked: PublicDriveItem[],
    importCategory: string,
  ) {
    const added = archiveWorksFromDrive(picked, importCategory);
    setUndoSnapshot(works);
    const next = [...added, ...works];
    const nextCategories = archiveCategories.includes(added[0].category)
      ? archiveCategories
      : [...archiveCategories, added[0].category];
    await persist(
      next,
      false,
      `${added.length}장을 “${added[0].category}” 초안으로 가져와 저장했습니다. 방문객에게는 아직 보이지 않습니다.`,
      nextCategories,
    );
    setDriveOpen(false);
    setCategory("전체");
    setSelectedIds(new Set(added.map((item) => item.id)));
  }
  return (
    <main className="archive-manager">
      <ArchiveHeader backHref="/admin/editor" backLabel="화면 편집" title="아카이브"
        count={works.filter(work => work.status !== "trashed").length}
        dirty={dirty || categoriesDirty}
        status={saving ? "저장 중…" : dirty || categoriesDirty ? "저장하지 않은 변경" : "모든 변경 저장됨"}>
          <div className="archive-add-menu" ref={addMenuRef}>
            <button
              className="archive-primary"
              aria-expanded={addMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAddMenuOpen((open) => !open)}
            >
              <Plus size={16} /> 사진 추가 <ChevronDown size={14} />
            </button>
            {addMenuOpen && (
              <div className="archive-add-options ui-scrollbar" role="menu">
                <header>
                  <span>사진을 어떻게 추가할까요?</span>
                  <button
                    aria-label="사진 추가 메뉴 닫기"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </header>
                <button
                  role="menuitem"
                  onClick={() => {
                    setAddMenuOpen(false);
                    setDriveOpen(true);
                  }}
                >
                  <FolderOpen size={18} />
                  <strong>
                    Drive에서 가져오기
                    <small>폴더에서 여러 장을 한 번에 선택</small>
                  </strong>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setAddMenuOpen(false);
                    create();
                  }}
                >
                  <ImagePlus size={18} />
                  <strong>
                    한 장 직접 추가
                    <small>사진 주소와 정보를 직접 입력</small>
                  </strong>
                </button>
              </div>
            )}
          </div>
      </ArchiveHeader>
      <ArchiveNavigation />
      <div
        className={`archive-workspace ui-scrollbar${visibleSelectedCount ? " selection-active" : ""}${editorOpen ? " detail-open" : ""}${collectionsCollapsed ? " collections-collapsed" : ""}${resizingCollections ? " collections-resizing" : ""}`}
        style={
          collectionWidth === null
            ? undefined
            : ({ "--archive-collection-width": `${collectionWidth}px` } as CSSProperties)
        }
      >
        <button
          className="archive-collection-toggle"
          aria-label={collectionsCollapsed ? "컬렉션 사이드바 펼치기" : "컬렉션 사이드바 접기"}
          aria-expanded={!collectionsCollapsed}
          aria-controls="archive-collections"
          title={collectionsCollapsed ? "컬렉션 펼치기" : "컬렉션 접기"}
          onClick={() => setCollectionsCollapsed((collapsed) => !collapsed)}
        >
          {collectionsCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div
          className="archive-collection-resize"
          role="separator"
          aria-label="컬렉션 사이드바 너비 조절"
          aria-orientation="vertical"
          aria-valuemin={collectionWidthBounds.min}
          aria-valuemax={collectionWidthBounds.max}
          aria-valuenow={collectionWidth ?? 248}
          tabIndex={collectionsCollapsed ? -1 : 0}
          title="드래그 또는 방향키로 너비 조절 · 두 번 클릭하여 초기화"
          onDoubleClick={() => setCollectionWidth(null)}
          onPointerDown={resizeCollections}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const direction = event.key === "ArrowLeft" ? -1 : 1;
            setCollectionWidth((width) =>
              clampCollectionWidth((width ?? 248) + direction * 16),
            );
          }}
        />
        <aside id="archive-collections" className="archive-collections ui-scrollbar" aria-label="컬렉션" inert={collectionsCollapsed}>
          <div>
            <strong><small>PHOTO LIBRARY</small>컬렉션</strong>
            <button
              title="새 컬렉션"
              aria-label="새 컬렉션"
              aria-expanded={addingCategory}
              onClick={() => setAddingCategory((open) => !open)}
            >
              {addingCategory ? <X size={15} /> : <Plus size={15} />}
            </button>
          </div>
          {addingCategory && (
            <ArchiveCollectionNameForm
              className="archive-add-collection"
              fieldId="new-archive-category"
              label="새 컬렉션 이름"
              placeholder="예: 제주 여름"
              autoFocus
              value={newCategoryName}
              submitLabel="컬렉션 만들기"
              disabled={!newCategoryName.trim() || categories.includes(newCategoryName.trim()) || saving}
              onChange={setNewCategoryName}
              onSubmit={() => void createCategory()}
            />
          )}
          <p className="archive-drag-hint">손잡이를 드래그해 순서를 바꾸세요.</p>
          <ArchiveCollectionList categories={categories} selected={status === "trashed" ? "" : category}
            counts={Object.fromEntries(categories.map(name => [name, works.filter(work => work.status !== "trashed" && (name === "전체" || work.category === name)).length]))}
            disabled={saving} onSave={saveCollectionOrder} onSelect={name => { clearSelection(); setCategory(name); if (status === "trashed") setStatus("all"); }} />
          <footer className="archive-collection-footer">
          <button
            className="archive-muted"
            aria-pressed={status === "trashed"}
            onClick={toggleTrashView}
          >
            <Trash2 size={14} />
            <span>휴지통</span>
            <em>{trashedCount}</em>
          </button>
          <p>컬렉션을 골라 사진을 정리하세요.</p>
          </footer>
        </aside>
        <section className="archive-library ui-scrollbar" aria-label="사진 작업대">
          <div className="archive-library-head">
            <div>
              <span>지금 보고 있는 컬렉션</span>
              {renamingCategory && category !== "전체" && status !== "trashed" ? (
                <ArchiveCollectionNameForm
                  className="archive-rename-collection-form archive-rename-title"
                  busy={saving}
                  fieldId="rename-archive-category"
                  label="컬렉션 이름"
                  autoFocus
                  value={renamedCategoryName}
                  submitLabel="저장"
                  disabled={!renamedCategoryName.trim() || renamedCategoryName.trim() === category || categories.includes(renamedCategoryName.trim()) || saving}
                  onChange={setRenamedCategoryName}
                  onSubmit={() => void renameCategory()}
                  onCancel={() => {
                    setRenamingCategory(false);
                    setRenamedCategoryName("");
                  }}
                />
              ) : (
                <h2>{status === "trashed" ? "휴지통" : category}</h2>
              )}
              {!renamingCategory && category !== "전체" && status !== "trashed" && (
                <div className="archive-collection-actions">
                  <button
                    className="archive-rename-collection"
                    aria-expanded={renamingCategory}
                    onClick={() => {
                      setRenamingCategory((open) => !open);
                      setRenamedCategoryName(category);
                    }}
                  >
                    <Pencil size={13} /> 이름 수정
                  </button>
                  <button
                    className="archive-delete-collection"
                    aria-label={`“${category}” 컬렉션 삭제`}
                    title="사진은 미분류로 옮겨집니다"
                    onClick={() => void removeCategory(category)}
                  >
                    <Trash2 size={13} />
                    컬렉션 삭제
                  </button>
                </div>
              )}
              <p>{visible.length}장의 사진</p>
            </div>
            <div className="archive-library-tools">
              <label>
                <Search size={14} />
                <input
                  aria-label="작품 검색"
                  placeholder="사진 찾기"
                  value={query}
                  onChange={(event) => {
                    clearSelection();
                    setQuery(event.target.value);
                  }}
                />
                {query && (
                  <button className="archive-search-clear" aria-label="검색 지우기" onClick={() => { clearSelection(); setQuery(""); }}>
                    <X size={15} />
                  </button>
                )}
              </label>
              <select
                aria-label="작품 상태"
                value={status}
                onChange={(event) => {
                  clearSelection();
                  setStatus(event.target.value as RecordStatus | "all");
                }}
              >
                <option value="all">휴지통 제외</option>
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                className={reorderMode ? "active" : ""}
                onClick={() => {
                  setReorderMode((value) => !value);
                  clearSelection();
                }}
              >
                <GripVertical size={15} />
                <span>{reorderMode ? "정렬 끝내기" : "순서 바꾸기"}</span>
              </button>
              <button
                aria-label="사진 크기 바꾸기"
                aria-pressed={gridLarge}
                title={gridLarge ? "사진 작게 보기" : "사진 크게 보기"}
                onClick={() => setGridLarge((value) => !value)}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
          <div className="archive-mobile-collection">
            <details className="archive-mobile-collections-list" onToggle={event => { if (!event.currentTarget.open) setMobileCollectionSorting(false); }}>
              <summary>{category}<ChevronDown size={15} /></summary>
              <div className="archive-mobile-collection-menu"><div className="archive-mobile-collection-tools"><button disabled={saving} aria-pressed={mobileCollectionSorting} onClick={() => setMobileCollectionSorting(value => !value)}>{mobileCollectionSorting ? "완료" : "순서 변경"}</button></div><ArchiveCollectionList sortable={mobileCollectionSorting} categories={categories} selected={status === "trashed" ? "" : category}
            counts={Object.fromEntries(categories.map(name => [name, works.filter(work => work.status !== "trashed" && (name === "전체" || work.category === name)).length]))}
            disabled={saving} onSave={saveCollectionOrder} onSelect={name => { clearSelection(); setCategory(name); if (status === "trashed") setStatus("all"); }} /></div>
            </details>
            <button
              className="archive-mobile-trash"
              aria-label={
                status === "trashed"
                  ? `휴지통 나가기 (${trashedCount}장)`
                  : `휴지통 보기 (${trashedCount}장)`
              }
              aria-pressed={status === "trashed"}
              onClick={toggleTrashView}
            >
              <Trash2 size={15} />
              <span className="archive-mobile-trash-count">
                {trashedCount}
              </span>
            </button>
            <button
              aria-label="새 컬렉션"
              aria-expanded={addingCategory}
              onClick={() => setAddingCategory((open) => !open)}
            >
              {addingCategory ? <X size={15} /> : <Plus size={15} />}
            </button>
          </div>

          {addingCategory && (
            <ArchiveCollectionNameForm
              className="archive-add-collection archive-add-collection-mobile"
              fieldId="new-archive-category-mobile"
              label="새 컬렉션 이름"
              ariaLabel="모바일 새 컬렉션 이름"
              placeholder="예: 제주 여름"
              value={newCategoryName}
              submitLabel="컬렉션 만들기"
              disabled={!newCategoryName.trim() || categories.includes(newCategoryName.trim()) || saving}
              onChange={setNewCategoryName}
              onSubmit={() => void createCategory()}
            />
          )}
          {reorderMode && (
            <div className="archive-gesture">
              <GripVertical size={15} />
              <span>사진을 잡아 원하는 위치에 놓으세요.</span>
              <button onClick={() => setReorderMode(false)}>확인</button>
            </div>
          )}
          <div
            className={`archive-grid-select-row${visibleSelectedCount ? " has-selection" : ""}`}
          >
            <label>
              <input
                ref={selectAllRef}
                type="checkbox"
                aria-label="현재 보이는 사진 전체 선택"
                checked={allVisibleSelected}
                disabled={!visible.length}
                onChange={toggleAllVisible}
              />
              <span>전체 선택</span>
            </label>
            {visibleSelectedCount > 0 && (
              <>
                <small>
                  {visibleSelectedCount}장 선택
                  {status === "trashed"
                    ? " · 휴지통 · 저장됨"
                    : selectedPrivateCount > 0
                    ? ` · ${selectedPrivateCount}장 비공개 · 저장됨`
                    : " · 모두 공개 중 · 저장됨"}
                </small>
                <div className="archive-grid-batch-actions">
                  {status === "trashed" ? (
                    <>
                      <button
                        disabled={saving}
                        onClick={() => void restoreSelected()}
                      >
                        <Undo2 size={14} /> 복원
                      </button>
                      <button
                        className={`danger${deleteConfirmation === "batch" ? " confirming" : ""}`}
                        disabled={saving}
                        onClick={() => void deleteSelectedPermanently()}
                      >
                        <Trash2 size={14} />
                        {deleteConfirmation === "batch"
                          ? "정말 삭제"
                          : "영구 삭제"}
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedPrivateCount > 0 && (
                        <button
                          className="publish"
                          disabled={saving}
                          onClick={() => void publishSelected()}
                        >
                          <Eye size={14} /> 사이트에 공개
                        </button>
                      )}
                      <select
                        aria-label="선택한 사진 컬렉션"
                        value={batchCategory}
                        onChange={(event) =>
                          setBatchCategory(event.target.value)
                        }
                      >
                        <option value="">컬렉션 이동</option>
                        {categories
                          .filter((item) => item !== "전체")
                          .map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                      </select>
                      <button
                        disabled={!batchCategory || saving}
                        onClick={() => void applyBatchCategory()}
                      >
                        이동
                      </button>
                      <button
                        className="danger"
                        disabled={saving}
                        onClick={() => void trashSelected()}
                      >
                        <Trash2 size={14} />
                        <span>휴지통</span>
                      </button>
                    </>
                  )}
                  <button onClick={clearSelection}>선택 해제</button>
                </div>
              </>
            )}
          </div>
          <div
            className={`archive-photo-grid${gridLarge ? " large" : ""}${reorderMode ? " sorting" : ""}${editorOpen ? " editing" : ""}`}
          >
            {visible.map((work) => (
              <article
                className={`${editorOpen && work.id === selectedId ? "active " : ""}${selectedIds.has(work.id) ? "selected " : ""}${work.status}`}
                key={work.id}
                draggable={reorderMode}
                onDragStart={() => setDraggedId(work.id)}
                onDragOver={(event) => {
                  if (reorderMode) event.preventDefault();
                }}
                onDrop={() => moveTo(work.id)}
              >
                <button
                  className="archive-photo"
                  aria-label={`${work.title || "제목 없는 작품"} 상세 편집`}
                  onClick={() => editWork(work.id)}
                >
                  <span>
                    {work.image ? (
                      <PreviewImage previewWidth={480} src={work.image} alt="" loading="lazy" />
                    ) : (
                      <ImagePlus size={28} />
                    )}
                  </span>
                  <strong>{work.title || "제목 없는 작품"}</strong>
                  <small>
                    {category === "전체"
                      ? work.category
                      : statusLabel[work.status]}
                  </small>
                </button>
                {!reorderMode && (
                  <div className="archive-card-actions">
                    <button
                      className={`archive-select-hint${selectedIds.has(work.id) ? " selected" : ""}`}
                      aria-label={`${work.title || "제목 없는 작품"} ${selectedIds.has(work.id) ? "선택 해제" : "선택"}`}
                      aria-pressed={selectedIds.has(work.id)}
                      onClick={() => toggleSelected(work.id)}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="archive-edit"
                      aria-label={`${work.title || "제목 없는 작품"} 편집`}
                      onClick={() => editWork(work.id)}
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                {reorderMode && (
                  <i className="archive-drag-mark">
                    <GripVertical size={17} />
                  </i>
                )}
                {work.status !== "published" && (
                  <em>{statusLabel[work.status]}</em>
                )}
              </article>
            ))}
          </div>
          {!visible.length && (
            <div className="archive-empty">
              <ImagePlus size={28} />
              <strong>
                {status === "trashed"
                  ? "휴지통이 비어 있습니다."
                  : "여기에 표시할 사진이 없습니다."}
              </strong>
              {status === "trashed" ? (
                <button onClick={toggleTrashView}>아카이브로 돌아가기</button>
              ) : (
                <button onClick={() => setDriveOpen(true)}>
                  Drive에서 사진 고르기
                </button>
              )}
            </div>
          )}
        </section>
        {selected && (
          <aside
            className={`archive-detail${editorOpen ? " open" : ""}`}
            aria-label="작품 편집"
          >
            <header>
              <button
                aria-label="작품 편집 닫기"
                onClick={() => setEditorOpen(false)}
              >
                <X size={18} />
              </button>
              <span>사진 정보 · 카드 앞면과 뒷면</span>
              <em className="archive-status">{statusLabel[selected.status]}</em>
            </header>
            <div className="archive-detail-scroll ui-scrollbar">
              <div className="archive-detail-image">
                {selected.image ? (
                  <button className="archive-detail-preview" aria-label="사진 크게 보기" onClick={() => setPhotoPreviewOpen(true)}>
                    <PreviewImage src={selected.image} alt={selected.title || "작품 사진"} />
                    <span><Maximize2 size={14} /> 크게 보기</span>
                  </button>
                ) : (
                  <ImagePlus size={32} />
                )}
              </div>
              <div className="archive-detail-fields">
                <h2>{selected.title}</h2>
                <p>여기서 수정한 정보가 갤러리와 메인 사진 카드에 함께 표시됩니다. 초안 저장 후 공개 반영하세요.</p>
                <label>
                  작품 제목
                  <input
                    aria-label="작품 제목"
                    value={selected.title}
                    onChange={(event) => update({ title: event.target.value })}
                  />
                </label>
                <label>
                  컬렉션
                  <select
                    aria-label="컬렉션"
                    value={selected.category}
                    onChange={(event) =>
                      update({ category: event.target.value })
                    }
                  >
                    {categories
                      .filter((item) => item !== "전체")
                      .map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                  </select>
                </label>
                <label>
                  장소 / 날짜
                  <input aria-label="장소 / 날짜" placeholder="예: 서울숲 · 2026. 09" maxLength={120}
                    value={selected.location ?? ''} onChange={event => update({ location: event.target.value })} />
                </label>
                <label>
                  작품 설명 · 카드 뒷면
                  <textarea
                    aria-label="작품 설명"
                    value={selected.note}
                    onChange={(event) => update({ note: event.target.value })}
                    rows={3}
                  />
                </label>
                <Link to={`/admin/editor?storyPhoto=archive-${selected.id}`} onClick={async event => {
                  event.preventDefault();
                  if (await persist()) navigateAfterSave(`/admin/editor?storyPhoto=archive-${selected.id}`);
                }}>초안 저장하고 카드 화면에서 편집 ↗</Link>
                <details>
                  <summary>
                    <Info size={14} /> 원본 정보
                  </summary>
                  <label>
                    사진 주소
                    <input
                      aria-label="사진 주소"
                      type="url"
                      value={selected.image}
                      onChange={(event) =>
                        update({ image: event.target.value })
                      }
                    />
                  </label>
                  <button
                    className="archive-remove-category"
                    onClick={() => void removeCategory(selected.category)}
                  >
                    “{selected.category}” 컬렉션 없애기
                  </button>
                </details>
              </div>
            </div>
            <footer>
              {selected.status === 'published' && <button className="archive-primary" disabled={saving || JSON.stringify(selected) === JSON.stringify(workspace?.archivePublished?.find(work => work.id === selected.id))} onClick={() => {
                const publication = (workspace?.archivePublished ?? initial).filter(work => work.id !== selected.id);
                const position = (workspace?.archivePublished ?? initial).findIndex(work => work.id === selected.id);
                publication.splice(position < 0 ? publication.length : position, 0, selected);
                void persist(works, true, '이 사진의 변경을 공개 반영했습니다.', archiveCategories, publication);
              }}>이 사진 변경 반영</button>}
              {selected.status === "draft" && (
                <button
                  className="archive-primary"
                  onClick={() => void changeStatus("published")}
                >
                  <Check size={15} /> 공개하기
                </button>
              )}
              {selected.status === "published" && (
                <button
                  className="archive-secondary"
                  onClick={() => void changeStatus("archived")}
                >
                  <Archive size={15} /> 숨기기
                </button>
              )}
              {selected.status === "archived" && (
                <button
                  className="archive-primary"
                  onClick={() => void changeStatus("published")}
                >
                  <Check size={15} /> 다시 공개
                </button>
              )}
              {selected.status === "trashed" && (
                <>
                  <button
                    className="archive-secondary"
                    onClick={() => void changeStatus("draft")}
                  >
                    <Undo2 size={15} /> 복원
                  </button>
                  <button
                    className={`archive-secondary archive-permanent-delete${deleteConfirmation === selected.id ? " confirming" : ""}`}
                    onClick={() =>
                      void deleteWorkPermanently(selected.id)
                    }
                  >
                    <Trash2 size={15} />
                    {deleteConfirmation === selected.id
                      ? "정말 삭제"
                      : "영구 삭제"}
                  </button>
                </>
              )}
              {selected.status !== "trashed" && (
                <button
                  className="archive-icon danger"
                  aria-label="휴지통으로 이동"
                  onClick={() => void changeStatus("trashed")}
                >
                  <Trash2 size={16} />
                </button>
              )}
              {selected.status !== "trashed" && (
                <button
                  className="archive-secondary"
                  disabled={(!dirty && !categoriesDirty) || saving}
                  onClick={() => void persist()}
                >
                  <Save size={15} /> 초안 저장
                </button>
              )}
            </footer>
          </aside>
        )}
      </div>
      {photoPreviewOpen && selected?.image && (
        <dialog
          ref={photoPreviewRef}
          className="archive-photo-preview"
          aria-label="사진 크게 보기"
          onCancel={() => setPhotoPreviewOpen(false)}
          onClick={(event) => { if (event.target === event.currentTarget) setPhotoPreviewOpen(false); }}
        >
          <button className="archive-photo-preview-close" aria-label="큰 사진 닫기" onClick={() => setPhotoPreviewOpen(false)}><X size={22} /></button>
          <PreviewImage previewWidth={null} src={selected.image} alt={selected.title || "작품 사진"} />
        </dialog>
      )}
      <ArchiveDrivePicker
        open={driveOpen}
        initialCategory={category === "전체" ? "새 컬렉션" : category}
        onClose={() => setDriveOpen(false)}
        onImport={importDriveSelection}
        onError={setError}
      />
      {(message || error) && (
        <div
          className={`archive-toast${error ? " error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error || message}
          {undoSnapshot && !error && (
            <button
              className="archive-toast-undo"
              onClick={() => void undoLast()}
            >
              되돌리기
            </button>
          )}
          <button
            aria-label="알림 닫기"
            onClick={() => {
              setMessage("");
              setError("");
            }}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
