import { useUnsavedNavigation } from '../../content-editor/useUnsavedNavigation';
import { Link } from 'react-router-dom';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  GripVertical,
  History,
  ImagePlus,
  Layers,
  Maximize2,
  Minimize2,
  Monitor,
  MousePointer2,
  PanelRightClose,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { concepts } from "../../content/prototype-fixture";
import { readWorkspace, writeWorkspace, getCachedWorkspace } from "../../content-editor/repository";
import {
  listPublicDriveFolder,
  type DriveTrailItem,
  type PublicDriveItem,
} from "../../content-editor/publicDrive";
import {
  emptyWorkspace,
  safeMediaUrl,
  validValues,
  type Checkpoint,
  type ContentField,
  type Values,
  type Workspace,
} from "../../content-editor/model";
import "./admin-preview.css";

const pages = [
  {
    name: "메인 페이지",
    hint: "첫 장면과 작업 소개",
    query: "",
    section: "top",
  },
  { name: "작가 소개", hint: "소개 문구와 사진", query: "", section: "about" },
  {
    name: "촬영 안내",
    hint: "문의와 안내 문구",
    query: "",
    section: "contact",
  },
  { name: "포트폴리오", hint: "작품 목록과 사진", query: "&gallery=all" },
  { name: "소식 / 블로그", hint: "글과 대표 사진", query: "&news=all" },
  {
    name: "패키지 / 가격",
    hint: "촬영 상품과 상세 안내",
    query: "&panel=촬영 안내",
  },
  {
    name: "자주 묻는 질문",
    hint: "촬영 정책과 답변",
    query: "&panel=자주 묻는 질문",
  },
  { name: "시작 화면", hint: "로딩 화면과 안내 문구", query: "&intro=1" },
];
const timeLabel = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "아직 저장하지 않음";
type HistoryState = { current: Values; past: Values[]; future: Values[] };

export default function AdminPreviewPrototype() {
  const [workspace, setWorkspace] = useState<Workspace>(() => getCachedWorkspace() ?? emptyWorkspace());
  const [history, setHistory] = useState<HistoryState>({
    current: getCachedWorkspace()?.draft ?? {},
    past: [],
    future: [],
  });
  const [loaded, setLoaded] = useState(() => Boolean(getCachedWorkspace()));
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, ContentField>>({});
  const [selectedId, setSelectedId] = useState("");
  const [editing, setEditing] = useState(true);
  const [width, setWidth] = useState("desktop");
  const [page, setPage] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"pages" | "fields">("pages");
  const [navOpen, setNavOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(() =>
    Math.min(
      520,
      Math.max(
        320,
        Number(localStorage.getItem("tree-film-inspector-width")) || 380,
      ),
    ),
  );
  const [modal, setModal] = useState<
    "history" | "publish" | "restore" | "rename" | "delete" | "discard" | null
  >(null);
  const [checkpointName, setCheckpointName] = useState("");
  const [checkpointTarget, setCheckpointTarget] = useState<Checkpoint | null>(
    null,
  );
  const [previewCheckpoint, setPreviewCheckpoint] = useState<Checkpoint | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [driveItems, setDriveItems] = useState<PublicDriveItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveTrail, setDriveTrail] = useState<DriveTrailItem[]>([]);
  const [driveSelected, setDriveSelected] = useState<PublicDriveItem | null>(
    null,
  );
  const [assetPicker, setAssetPicker] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const assetDialog = useRef<HTMLDialogElement>(null);
  const focusBeforeDialog = useRef<HTMLElement | null>(null);
  const selected = fields[selectedId];
  const draft = history.current;
  const dirty = JSON.stringify(draft) !== JSON.stringify(workspace.draft);
  useUnsavedNavigation(dirty);
  const shownValues = previewCheckpoint?.values ?? draft;
  const editorMode = editing && !previewCheckpoint;
  const dirtyCount =
    Object.keys(draft).filter((id) => draft[id] !== workspace.published[id])
      .length +
    Object.keys(workspace.published).filter((id) => !(id in draft)).length;
  const previewDifference = previewCheckpoint
    ? (() => {
        const changed = Object.keys({
          ...draft,
          ...previewCheckpoint.values,
        }).filter((id) => draft[id] !== previewCheckpoint.values[id]);
        const roots = [
          ...new Set(changed.map((id) => id.replace(/\.(alt|name)$/, ""))),
        ];
        return {
          total: roots.length,
          images: roots.filter((id) => fields[id]?.kind === "image").length,
        };
      })()
    : null;
  const send = useCallback(
    (data: object) =>
      frame.current?.contentWindow?.postMessage(
        { source: "tree-film-editor", ...data },
        location.origin,
      ),
    [],
  );
  const sync = useCallback(
    () => send({ type: "sync", values: shownValues, editing: editorMode }),
    [send, shownValues, editorMode],
  );

  useEffect(() => {
    localStorage.setItem("tree-film-inspector-width", String(inspectorWidth));
  }, [inspectorWidth]);

  useEffect(() => {
    let active = true;
    void readWorkspace()
      .then((value) => {
        if (active) {
          setWorkspace(value);
          setHistory({ current: value.draft, past: [], future: [] });
          setLoaded(true);
        }
      })
      .catch((e) => setError(String(e.message)));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    sync();
  }, [sync, ready]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.source !== "tree-film-preview"
      )
        return;
      const data = event.data;
      if (data.type === "ready") {
        setReady(true);
        sync();
        send({ type: "request-fields" });
      }
      if (
        data.type === "field" &&
        typeof data.field?.id === "string" &&
        typeof data.field?.original === "string"
      ) {
        const field: ContentField = data.field;
        setFields((previous) =>
          previous[field.id]?.original === field.original
            ? previous
            : { ...previous, [field.id]: field },
        );
      }
      if (data.type === "select" && typeof data.id === "string") {
        setSelectedId(data.id);
        setInspectorOpen(true);
        setMessage("");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [sync, send]);
  useEffect(() => {
    setImageUrl("");
  }, [selectedId]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (modal) {
      if (!dialog.current?.open) {
        focusBeforeDialog.current = document.activeElement as HTMLElement;
        dialog.current?.showModal();
      }
    } else if (dialog.current?.open) {
      dialog.current.close();
      focusBeforeDialog.current?.focus();
    }
  }, [modal]);
  useEffect(() => {
    if (assetPicker) assetDialog.current?.showModal();
    else assetDialog.current?.close();
  }, [assetPicker]);

  function edit(next: Values) {
    if (busy || previewCheckpoint) return;
    setHistory((previous) => ({
      current: next,
      past: [...previous.past.slice(-49), previous.current],
      future: [],
    }));
    setError("");
    setMessage("");
  }
  function change(value: string, id = selectedId) {
    const next = { ...draft };
    if (value === fields[id]?.original || (value === "" && !fields[id]))
      delete next[id];
    else next[id] = value;
    edit(next);
  }
  async function openPublicDrive(
    value = driveFolderUrl,
    nextTrail?: DriveTrailItem[],
  ) {
    setDriveLoading(true);
    setError("");
    try {
      const result = await listPublicDriveFolder(value);
      setDriveItems(result.items);
      setDriveTrail(nextTrail ?? [{ id: result.folderId, name: "포트폴리오" }]);
      setDriveSelected(null);
      setMessage(`${result.items.length}개 항목을 불러왔습니다.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "공개 폴더를 읽지 못했습니다.");
    } finally {
      setDriveLoading(false);
    }
  }
  function applyDriveSelected() {
    if (!driveSelected?.sourceUrl) return;
    change(driveSelected.sourceUrl);
    setAssetPicker(false);
    setMessage(
      `“${driveSelected.name}” 사진을 적용했습니다. 초안을 저장해 주세요.`,
    );
  }
  function enterPreview(point: Checkpoint) {
    setPreviewCheckpoint(point);
    setInspectorOpen(false);
    setNavOpen(false);
    setModal(null);
  }
  async function renameCheckpoint() {
    if (!checkpointTarget || !checkpointName.trim()) return;
    const name = checkpointName.trim();
    if (
      await persist(
        {
          ...workspace,
          draft,
          checkpoints: workspace.checkpoints.map((point) =>
            point.id === checkpointTarget.id ? { ...point, name } : point,
          ),
        },
        "체크포인트 이름을 바꿨습니다.",
      )
    ) {
      if (previewCheckpoint?.id === checkpointTarget.id)
        setPreviewCheckpoint({ ...checkpointTarget, name });
      setCheckpointTarget(null);
      setCheckpointName("");
      setModal(null);
    }
  }
  async function deleteCheckpoint() {
    if (!checkpointTarget) return;
    if (
      await persist(
        {
          ...workspace,
          draft,
          checkpoints: workspace.checkpoints.filter(
            (point) => point.id !== checkpointTarget.id,
          ),
        },
        `“${checkpointTarget.name}” 체크포인트를 삭제했습니다.`,
      )
    ) {
      if (previewCheckpoint?.id === checkpointTarget.id)
        setPreviewCheckpoint(null);
      setCheckpointTarget(null);
      setModal(null);
    }
  }
  function discardUnsavedChanges() {
    setHistory({ current: { ...workspace.draft }, past: [], future: [] });
    setSelectedId("");
    setInspectorOpen(false);
    setModal(null);
    setMessage("저장한 초안으로 돌아갔습니다.");
  }
  function undo() {
    if (busy || previewCheckpoint) return;
    setHistory((h) =>
      h.past.length
        ? {
            current: h.past[h.past.length - 1],
            past: h.past.slice(0, -1),
            future: [h.current, ...h.future],
          }
        : h,
    );
  }
  function redo() {
    if (busy || previewCheckpoint) return;
    setHistory((h) =>
      h.future.length
        ? {
            current: h.future[0],
            past: [...h.past, h.current],
            future: h.future.slice(1),
          }
        : h,
    );
  }
  async function persist(next: Workspace, success: string) {
    if (!loaded || busy) return false;
    setBusy(true);
    setError("");
    try {
      const saved = await writeWorkspace(next);
      setWorkspace(saved);
      setHistory(previous => ({ ...previous, current: saved.draft }));
      setMessage(success);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const save = () =>
    persist(
      { ...workspace, draft },
      "초안을 저장했습니다. 방문객 화면은 바뀌지 않습니다.",
    );
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !modal && !assetPicker) {
        setNavOpen(false);
        setInspectorOpen(false);
        setSelectedId("");
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
      if ((event.target as HTMLElement).closest("input,textarea,select"))
        return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

  function navigate(index: number) {
    setPage(index);
    setSelectedId("");
    setInspectorOpen(false);
    setNavOpen(false);
    setFields({});
    setReady(false);
    setFrameKey((value) => value + 1);
  }
  function select(field: ContentField) {
    setSelectedId(field.id);
    setInspectorOpen(true);
    setEditing(true);
    send({ type: "focus", id: field.id });
  }
  function exportDraft() {
    const blob = new Blob(
      [JSON.stringify({ schema: 1, values: draft }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tree-film-draft.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importDraft(file?: File) {
    if (!file) return;
    try {
      if (file.size > 50 * 1024 * 1024)
        throw new Error("백업 파일은 50MB 이하만 지원합니다.");
      const value = JSON.parse(await file.text());
      if (value.schema !== 1 || !validValues(value.values))
        throw new Error("이 편집기에서 내보낸 초안 파일을 선택해 주세요.");
      edit(value.values);
      setMessage(
        "백업을 초안으로 불러왔습니다. 실행 취소로 이전 초안으로 돌아갈 수 있습니다.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function checkpoint() {
    if (!checkpointName.trim()) return;
    const next: Checkpoint = {
      id: crypto.randomUUID(),
      name: checkpointName.trim(),
      createdAt: new Date().toISOString(),
      values: { ...draft },
      newsDraft: workspace.newsDraft
        ? structuredClone(workspace.newsDraft)
        : undefined,
    };
    if (
      await persist(
        { ...workspace, draft, checkpoints: [next, ...workspace.checkpoints] },
        "체크포인트를 저장했습니다.",
      )
    )
      setCheckpointName("");
  }
  async function restore(point: Checkpoint) {
    const backup: Checkpoint = {
      id: crypto.randomUUID(),
      name: "복원 직전 자동 백업",
      createdAt: new Date().toISOString(),
      values: { ...draft },
      newsDraft: workspace.newsDraft
        ? structuredClone(workspace.newsDraft)
        : undefined,
    };
    if (
      await persist(
        {
          ...workspace,
          draft: { ...point.values },
          newsDraft: point.newsDraft
            ? structuredClone(point.newsDraft)
            : undefined,
          checkpoints: [backup, ...workspace.checkpoints],
        },
        `“${point.name}” 상태를 초안으로 복원했습니다. 공개 상태는 유지됩니다.`,
      )
    ) {
      setHistory((h) => ({
        current: { ...point.values },
        past: [...h.past.slice(-49), h.current],
        future: [],
      }));
      setPreviewCheckpoint(null);
      setModal(null);
    }
  }

  const fieldList = Object.values(fields).filter((field) =>
    `${field.label} ${field.section} ${field.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function resizeInspector(clientX: number) {
    setInspectorWidth(
      Math.min(520, Math.max(320, window.innerWidth - clientX)),
    );
  }

  return (
    <main
      className={`studio${focusMode ? " focus-mode" : ""}`}
      style={{ "--inspector-width": `${inspectorWidth}px` } as CSSProperties}
    >
      <header className="studio-header">
        <Link className="studio-brand" to="/admin/editor">
          <span className="studio-brand-mark">T</span>
          <span>
            TREE FILM<small>콘텐츠 스튜디오</small>
          </span>
        </Link>
        <nav className="studio-global-nav" aria-label="관리 영역">
          <button
            className="studio-secondary"
            aria-label="페이지"
            aria-expanded={navOpen && tab === "pages"}
            aria-controls="studio-navigation"
            onClick={() => {
              setTab("pages");
              setNavOpen(true);
              setInspectorOpen(false);
            }}
          >
            <Layers size={15} />
            <span>페이지</span>
          </button>
          <details className="studio-management-menu">
            <summary className="studio-secondary">
              <FileText size={15} />
              <span>사이트 관리</span>
            </summary>
            <div>
              <span>무엇을 바꿀까요?</span>

              <Link to="/admin/content/archive">
                <ImagePlus size={18} />
                <strong>
                  아카이브<small>사진 정보와 메인 강조 사진</small>
                </strong>
                <ChevronRight size={14} />
              </Link>
              <Link to="/admin/content/news">
                <History size={18} />
                <strong>
                  소식<small>뉴스, 행사와 진행 상태</small>
                </strong>
                <ChevronRight size={14} />
              </Link>
            </div>
          </details>
        </nav>
        <div className="studio-document">
          <span>사이트</span>
          <ChevronRight size={13} />
          <strong>{pages[page].name}</strong>
          <span className="studio-status">
            {previewCheckpoint
              ? "체크포인트 검토 중"
              : !loaded
                ? "불러오는 중…"
                : busy
                  ? "저장 중…"
                  : dirty
                    ? "저장하지 않은 변경"
                    : workspace.savedAt
                      ? "초안 저장됨"
                      : "새 초안"}
          </span>
        </div>
        {previewCheckpoint ? (
          <div className="studio-review-header">
            <span>READ ONLY</span>
            <button
              className="studio-secondary"
              onClick={() => setPreviewCheckpoint(null)}
            >
              현재 초안으로 돌아가기
            </button>
          </div>
        ) : (
          <div
            className="studio-actions"
            role="toolbar"
            aria-label="현재 페이지 작업"
          >
            <button
              className="studio-icon studio-utility"
              title="실행 취소"
              aria-label="실행 취소"
              disabled={!history.past.length || busy}
              onClick={undo}
            >
              <Undo2 size={17} />
            </button>
            <button
              className="studio-icon studio-utility"
              title="다시 실행"
              aria-label="다시 실행"
              disabled={!history.future.length || busy}
              onClick={redo}
            >
              <Redo2 size={17} />
            </button>
            <button
              className="studio-icon studio-utility"
              title="체크포인트"
              aria-label="체크포인트"
              onClick={() => setModal("history")}
            >
              <History size={17} />
            </button>
            <button
              className="studio-icon studio-utility"
              title="저장한 초안으로 되돌리기"
              aria-label="저장한 초안으로 되돌리기"
              disabled={!dirty || busy}
              onClick={() => setModal("discard")}
            >
              <RotateCcw size={17} />
            </button>
            <button
              className="studio-secondary"
              aria-label="초안 저장"
              onClick={() => void save()}
              disabled={!loaded || busy || !dirty}
            >
              <Save size={15} />
              <span>초안 저장</span>
            </button>
            <button
              className="studio-primary"
              disabled={!loaded || busy || !dirtyCount}
              onClick={() => setModal("publish")}
            >
              반영하기 <ChevronRight size={14} />
            </button>
          </div>
        )}
      </header>
      <div className="studio-environment">
        <span className="studio-dot" />{" "}
        <strong>
          {dirty
            ? "저장되지 않은 변경"
            : workspace.savedAt
              ? "초안이 안전하게 저장됨"
              : "새 초안"}
        </strong>
        <span>
          {dirty
            ? "저장하면 방문객 화면에는 아직 반영되지 않습니다."
            : "현재 편집 중인 내용입니다."}
        </span>
        <a href={import.meta.env.BASE_URL + 'prototype/total'} target="_blank" rel="noreferrer">
          방문객 화면 <ExternalLink size={12} />
        </a>
      </div>
      <div className={`studio-layout${inspectorOpen ? " has-inspector" : ""}`}>
        {navOpen && (
          <button
            className="studio-panel-scrim"
            aria-label="페이지 패널 닫기"
            onClick={() => setNavOpen(false)}
          />
        )}
        <aside
          id="studio-navigation"
          className={`studio-nav${navOpen ? " open" : ""}`}
          aria-label="콘텐츠 탐색"
          aria-hidden={!navOpen}
        >
          <div className="studio-nav-tabs">
            <button
              aria-pressed={tab === "pages"}
              onClick={() => setTab("pages")}
            >
              <Layers size={14} /> 페이지
            </button>
            <button
              aria-pressed={tab === "fields"}
              onClick={() => setTab("fields")}
            >
              <Search size={14} /> 편집 항목
            </button>
            <button
              className="studio-nav-close"
              aria-label="페이지 패널 닫기"
              onClick={() => setNavOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          {tab === "pages" ? (
            <nav>
              {pages.map((item, index) => (
                <button
                  key={item.name}
                  className={page === index ? "active" : ""}
                  onClick={() => navigate(index)}
                >
                  <span className="studio-page-icon">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {item.name}
                    <small>{item.hint}</small>
                  </span>
                  <ChevronRight size={13} />
                </button>
              ))}
            </nav>
          ) : (
            <>
              <label className="studio-search">
                <Search size={14} />
                <input
                  aria-label="편집 항목 검색"
                  placeholder="문구, 사진 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="studio-field-list">
                {fieldList.map((field) => (
                  <button
                    className={selectedId === field.id ? "active" : ""}
                    key={field.id}
                    onClick={() => select(field)}
                  >
                    {field.kind === "image" ? (
                      <ImagePlus size={13} />
                    ) : (
                      <FileText size={13} />
                    )}
                    <span>
                      {field.label || "빈 문구"}
                      <small>{field.section}</small>
                    </span>
                    {draft[field.id] !== undefined && <i />}
                  </button>
                ))}
                {!fieldList.length && (
                  <p>이 페이지에서 찾은 항목이 없습니다.</p>
                )}
              </div>
            </>
          )}
          <div className="studio-nav-bottom">
            <span>초안 백업</span>
            <button onClick={exportDraft}>
              <Download size={14} /> 파일로 내보내기
            </button>
            <label>
              <Upload size={14} /> 백업 불러오기
              <input
                type="file"
                accept="application/json,.json"
                disabled={busy || !!previewCheckpoint}
                onChange={(e) => {
                  void importDraft(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <small>
              마지막 저장
              <br />
              {timeLabel(workspace.savedAt)}
            </small>
          </div>
        </aside>
        <section className="studio-canvas" aria-label="실제 사이트 미리보기">
          <div className="studio-toolbar">
            <select
              className="studio-mobile-pages"
              aria-label="편집할 페이지"
              value={page}
              onChange={(e) => navigate(Number(e.target.value))}
            >
              {pages.map((item, index) => (
                <option value={index} key={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="studio-mode">
              <button
                aria-pressed={editorMode}
                disabled={!!previewCheckpoint}
                onClick={() => setEditing(true)}
              >
                <MousePointer2 size={14} /> 선택 편집
              </button>
              <button
                aria-pressed={!editorMode}
                onClick={() => setEditing(false)}
              >
                둘러보기
              </button>
            </div>
            <span className="studio-preview-url">/prototype/total</span>
            <div className="studio-devices">
              {[
                ["desktop", Monitor, "데스크톱"],
                ["tablet", Tablet, "태블릿"],
                ["mobile", Smartphone, "모바일"],
              ].map(([key, Icon, label]) => {
                const Device = Icon as typeof Monitor;
                return (
                  <button
                    key={String(key)}
                    aria-label={`${label} 화면`}
                    aria-pressed={width === key}
                    onClick={() => setWidth(String(key))}
                  >
                    <Device size={16} />
                  </button>
                );
              })}
            </div>
            <button
              className="studio-focus-toggle"
              aria-pressed={focusMode}
              onClick={() => {
                setFocusMode((value) => !value);
                if (!focusMode) {
                  setInspectorOpen(false);
                  setNavOpen(false);
                }
              }}
              title={
                focusMode ? "편집 화면으로 돌아가기" : "미리보기 크게 보기"
              }
            >
              {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{focusMode ? "편집 화면" : "크게 보기"}</span>
            </button>
          </div>
          {previewCheckpoint ? (
            <div className="studio-review-banner">
              <div>
                <span>CHECKPOINT REVIEW · READ ONLY</span>
                <strong>
                  “{previewCheckpoint.name}” 버전을 검토하고 있습니다
                </strong>
                <small>
                  {timeLabel(previewCheckpoint.createdAt)} · 현재 초안과 콘텐츠{" "}
                  {previewDifference?.total ?? 0}개
                  {previewDifference?.images
                    ? ` · 사진 ${previewDifference.images}장`
                    : ""}{" "}
                  차이
                </small>
              </div>
              <div>
                <button
                  className="studio-secondary"
                  onClick={() => setPreviewCheckpoint(null)}
                >
                  현재 초안으로 돌아가기
                </button>
                <button
                  className="studio-primary"
                  onClick={() => setModal("restore")}
                >
                  이 버전으로 복원
                </button>
              </div>
            </div>
          ) : (
            <p className="studio-hint">
              <span className="studio-dot" />
              {editing
                ? "바꾸고 싶은 문구나 사진을 클릭하세요. 메뉴 이동은 둘러보기에서 할 수 있어요."
                : "사이트를 둘러보며 상세창을 연 다음, 선택 편집으로 전환하세요."}
            </p>
          )}
          <div className={`studio-stage ${width}`}>
            <div className="studio-frame-shell">
              {!ready && (
                <div className="studio-frame-loading">
                  페이지를 준비하고 있습니다…
                </div>
              )}
              <iframe
                key={frameKey}
                ref={frame}
                title="TREE FILM 편집 미리보기"
                src={`${import.meta.env.BASE_URL}prototype/total?editor=1${pages[page].query}${page === 0 && new URLSearchParams(location.search).has("storyPhoto") ? `&storyPhoto=${encodeURIComponent(new URLSearchParams(location.search).get("storyPhoto")!)}` : ""}`}
                onLoad={() => {
                  sync();
                  send({ type: "request-fields" });
                  if (pages[page].section)
                    send({ type: "jump", id: pages[page].section });
                }}
              />
            </div>
          </div>
          <div className="studio-canvas-footer">
            <span>
              <Check size={12} />{" "}
              {ready ? "실제 페이지와 연결됨" : "페이지 연결 중…"}
            </span>
            <span>
              {width === "mobile"
                ? "390px"
                : width === "tablet"
                  ? "768px"
                  : "화면 너비에 맞춤"}{" "}
              · {Object.keys(fields).length}개 편집 항목
            </span>
          </div>
        </section>
        <aside
          className={`studio-inspector${inspectorOpen ? " open" : ""}`}
          aria-label="선택 항목 편집"
          aria-hidden={!inspectorOpen}
        >
          <div
            className="studio-inspector-resizer"
            role="separator"
            aria-label="편집 패널 너비 조절"
            aria-orientation="vertical"
            aria-valuemin={320}
            aria-valuemax={520}
            aria-valuenow={inspectorWidth}
            tabIndex={0}
            onPointerDown={(event) =>
              event.currentTarget.setPointerCapture(event.pointerId)
            }
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                resizeInspector(event.clientX);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft")
                setInspectorWidth((value) => Math.min(520, value + 16));
              if (event.key === "ArrowRight")
                setInspectorWidth((value) => Math.max(320, value - 16));
            }}
          >
            <GripVertical size={14} />
          </div>
          <div className="studio-inspector-top">
            <div>
              <span>선택한 콘텐츠</span>
              <small>왼쪽 손잡이를 끌어 넓이를 조절하세요</small>
            </div>
            <button
              className="studio-icon"
              aria-label="편집 패널 닫기"
              onClick={() => {
                setInspectorOpen(false);
                setSelectedId("");
              }}
            >
              <PanelRightClose size={16} />
            </button>
          </div>
          <select
            className="studio-mobile-field"
            aria-label="편집할 항목"
            value={selectedId}
            onChange={(e) => {
              const field = fields[e.target.value];
              if (field) select(field);
            }}
          >
            <option value="">화면에서 선택하거나 항목 찾기</option>
            {Object.values(fields).map((field) => (
              <option key={field.id} value={field.id}>
                {field.section} · {field.label}
              </option>
            ))}
          </select>
          {selected ? (
            <div className="studio-inspector-body">
              <div className="studio-field-type">
                {selected.kind === "text"
                  ? "문구"
                  : selected.kind === "image"
                    ? "사진"
                    : "첨부파일"}
                <span>{selected.section}</span>
              </div>
              <h1>
                {selected.kind === "image"
                  ? "사진 바꾸기"
                  : selected.kind === "attachment"
                    ? "첨부파일 바꾸기"
                    : selected.label || "문구 바꾸기"}
              </h1>
              <fieldset disabled={busy || !!previewCheckpoint || !loaded}>
                {selected.kind === "text" ? (
                  <label className="studio-field">
                    내용
                    <textarea
                      aria-label="선택한 문구"
                      value={shownValues[selectedId] ?? selected.original}
                      rows={7}
                      onChange={(e) => change(e.target.value)}
                    />
                    <span className="studio-field-note">
                      {(shownValues[selectedId] ?? selected.original).length}자
                      · 줄바꿈을 포함해 바로 반영됩니다
                    </span>
                  </label>
                ) : (
                  <>
                    {selected.kind === "image" && (
                      <div className="studio-image-preview">
                        <img
                          src={shownValues[selectedId] ?? selected.original}
                          alt="선택한 이미지 미리보기"
                        />
                      </div>
                    )}
                    {selected.kind === "image" && (
                      <section className="studio-asset-card">
                        <div>
                          <span>PHOTO LIBRARY</span>
                          <strong>작업 사진 보관함</strong>
                          <p>
                            {driveTrail.length
                              ? `${driveTrail[driveTrail.length - 1].name} · ${driveItems.length}개 항목`
                              : "공개 Drive 폴더를 한 번 연결해 사용하세요."}
                          </p>
                        </div>
                        <button
                          className="studio-primary"
                          type="button"
                          onClick={() => {
                            setAssetPicker(true);
                            if (!driveTrail.length && driveFolderUrl.trim())
                              void openPublicDrive();
                          }}
                        >
                          <FolderOpen size={15} /> 사진 보관함 열기
                        </button>
                      </section>
                    )}
                    <label className="studio-field">
                      {selected.kind === "image"
                        ? "직접 이미지 주소"
                        : "문서 주소"}
                      <input
                        type="url"
                        aria-label="미디어 주소"
                        placeholder="https://…"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </label>
                    <button
                      className="studio-secondary studio-full"
                      disabled={!imageUrl.trim()}
                      onClick={() => {
                        if (
                          /drive\.google\.com\/drive\/folders\//.test(imageUrl)
                        ) {
                          setDriveFolderUrl(imageUrl.trim());
                          setImageUrl("");
                          setAssetPicker(true);
                          void openPublicDrive(imageUrl.trim());
                        } else if (
                          !safeMediaUrl(
                            imageUrl.trim(),
                            selected.kind === "image",
                          )
                        )
                          setError("HTTPS 주소를 입력해 주세요.");
                        else {
                          change(imageUrl.trim());
                          setImageUrl("");
                          setMessage(
                            `${selected.kind === "image" ? "이미지" : "문서"} 주소를 연결했습니다. 초안을 저장해 주세요.`,
                          );
                        }
                      }}
                    >
                      주소 적용
                    </button>
                    {selected.kind === "attachment" &&
                      (shownValues[selectedId] ?? selected.original) && (
                        <button
                          className="studio-reset studio-unlink"
                          type="button"
                          onClick={() => change("")}
                        >
                          <Trash2 size={13} /> 첨부 연결 해제
                        </button>
                      )}
                    <label className="studio-field">
                      {selected.kind === "image" ? "대체 텍스트" : "첨부 이름"}
                      <input
                        aria-label={
                          selected.kind === "image"
                            ? "대체 텍스트"
                            : "첨부 이름"
                        }
                        value={
                          shownValues[
                            selectedId +
                              (selected.kind === "image" ? ".alt" : ".name")
                          ] ??
                          selected.alt ??
                          ""
                        }
                        onChange={(e) =>
                          change(
                            e.target.value,
                            selectedId +
                              (selected.kind === "image" ? ".alt" : ".name"),
                          )
                        }
                      />
                      <span className="studio-field-note">
                        {selected.kind === "image"
                          ? "사진을 볼 수 없는 방문객에게 내용을 설명합니다."
                          : "방문객에게 표시할 이름입니다."}
                      </span>
                    </label>
                    {selected.kind === "image" && (
                      <details className="studio-library">
                        <summary>기존 사진에서 고르기</summary>
                        <div>
                          {concepts
                            .flatMap((c) => c.photos)
                            .map((photo) => (
                              <button
                                aria-label={`사진 ${photo.id} 선택`}
                                key={photo.id}
                                onClick={() => change(photo.src)}
                              >
                                <img
                                  src={photo.src}
                                  alt={photo.story}
                                  loading="lazy"
                                />
                              </button>
                            ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
                <button
                  className="studio-reset"
                  disabled={draft[selectedId] === undefined}
                  onClick={() => {
                    const next = { ...draft };
                    delete next[selectedId];
                    delete next[selectedId + ".alt"];
                    delete next[selectedId + ".name"];
                    edit(next);
                  }}
                >
                  <RotateCcw size={13} /> 기본 콘텐츠로 되돌리기
                </button>
              </fieldset>
              <div className="studio-field-meta">
                <span>편집 안내</span>
                <p>
                  연결된 다른 화면에도 함께 반영됩니다. 초안을 저장해도 방문객
                  화면은 바뀌지 않습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="studio-empty">
              <div>
                <MousePointer2 size={27} />
              </div>
              <h1>
                보이는 곳에서,
                <br />
                바로 편집하세요.
              </h1>
              <p>
                화면의 문구나 사진을 선택하면
                <br />
                여기에 편집할 내용이 나타납니다.
              </p>
              <hr />
              <span>
                01 <b>화면에서 선택</b>
              </span>
              <span>
                02 <b>내용 수정 · 미리보기</b>
              </span>
              <span>
                03 <b>초안 저장 · 체크포인트</b>
              </span>
            </div>
          )}
          <div className="studio-inspector-footer">
            <span className="studio-dot" /> {dirtyCount}개 변경 · 공개 반영 전
          </div>
        </aside>
      </div>
      {(error || message) && (
        <div
          className={`studio-toast${error ? " error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || message}</span>
          <button
            aria-label="알림 닫기"
            onClick={() => {
              setError("");
              setMessage("");
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <dialog
        className="studio-asset-dialog"
        ref={assetDialog}
        onCancel={() => setAssetPicker(false)}
        aria-label="작업 사진 보관함"
      >
        <header className="studio-asset-header">
          <div>
            <span>PUBLIC DRIVE LIBRARY</span>
            <h2>작업 사진 보관함</h2>
            <p>폴더를 열고, 사진을 고른 뒤 적용하세요.</p>
          </div>
          <button
            className="studio-icon"
            aria-label="사진 보관함 닫기"
            onClick={() => setAssetPicker(false)}
          >
            <X size={21} />
          </button>
        </header>
        <div className="studio-asset-connect">
          <label>
            <span>공개 Drive 폴더</span>
            <input
              aria-label="공개 Drive 폴더 링크"
              placeholder="https://drive.google.com/drive/folders/…"
              value={driveFolderUrl}
              onChange={(e) => setDriveFolderUrl(e.target.value)}
            />
          </label>
          <button
            className="studio-primary"
            type="button"
            disabled={driveLoading || !driveFolderUrl.trim()}
            onClick={() => void openPublicDrive()}
          >
            {driveLoading ? "불러오는 중…" : "폴더 열기"}
          </button>
        </div>
        {driveTrail.length ? (
          <div className="studio-asset-browser">
            <div className="studio-asset-browser-top">
              <nav
                className="studio-drive-breadcrumb"
                aria-label="Drive 현재 위치"
              >
                {driveTrail.map((part, index) => (
                  <button
                    type="button"
                    key={part.id}
                    disabled={index === driveTrail.length - 1}
                    onClick={() => {
                      const trail = driveTrail.slice(0, index + 1);
                      void openPublicDrive(part.id, trail);
                    }}
                  >
                    {part.name}
                  </button>
                ))}
              </nav>
              {driveTrail.length > 1 && (
                <button
                  className="studio-asset-back"
                  type="button"
                  onClick={() => {
                    const trail = driveTrail.slice(0, -1);
                    void openPublicDrive(trail[trail.length - 1].id, trail);
                  }}
                >
                  <ArrowLeft size={15} /> 상위 폴더
                </button>
              )}
            </div>
            <div className="studio-asset-layout">
              <section className="studio-asset-grid-wrap">
                <div className="studio-asset-section-title">
                  <span>FOLDERS</span>
                  <strong>폴더</strong>
                  <small>
                    {driveItems.filter((item) => item.kind === "folder").length}
                    개
                  </small>
                </div>
                {driveItems.some((item) => item.kind === "folder") ? (
                  <div className="studio-folder-grid">
                    {driveItems
                      .filter((item) => item.kind === "folder")
                      .map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() =>
                            void openPublicDrive(item.id, [
                              ...driveTrail,
                              { id: item.id, name: item.name },
                            ])
                          }
                        >
                          <FolderOpen size={22} />
                          <span>{item.name}</span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="studio-asset-empty">
                    이 위치에는 하위 폴더가 없습니다.
                  </p>
                )}
                <div className="studio-asset-section-title">
                  <span>IMAGES</span>
                  <strong>사진</strong>
                  <small>
                    {driveItems.filter((item) => item.kind === "image").length}
                    장
                  </small>
                </div>
                {driveItems.some((item) => item.kind === "image") ? (
                  <div className="studio-asset-grid">
                    {driveItems
                      .filter((item) => item.kind === "image")
                      .map((item) => (
                        <button
                          className="drive-image"
                          aria-pressed={driveSelected?.id === item.id}
                          type="button"
                          key={item.id}
                          onClick={() => setDriveSelected(item)}
                        >
                          <img src={item.thumbnailUrl} alt="" />
                          <span>{item.name}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="studio-asset-empty">
                    이 폴더에 표시할 사진이 없습니다.
                  </p>
                )}
              </section>
              <aside className="studio-asset-selection">
                {driveSelected ? (
                  <>
                    <div className="studio-asset-selected-image">
                      <img
                        src={driveSelected.thumbnailUrl}
                        alt={driveSelected.name}
                      />
                    </div>
                    <span>SELECTED PHOTO</span>
                    <h3>{driveSelected.name}</h3>
                    <p>현재 선택한 사진이 화면의 기존 사진을 교체합니다.</p>
                    <button
                      className="studio-primary studio-full"
                      type="button"
                      onClick={applyDriveSelected}
                    >
                      이 사진 적용 <ChevronRight size={15} />
                    </button>
                  </>
                ) : (
                  <div className="studio-asset-selection-empty">
                    <ImagePlus size={26} />
                    <strong>사진을 선택하세요</strong>
                    <p>
                      그리드에서 사진을 누르면 여기에서 크게 확인할 수 있습니다.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        ) : (
          <div className="studio-asset-blank">
            <FolderOpen size={32} />
            <strong>공개 폴더를 열어주세요</strong>
            <p>
              공유받은 Drive 폴더 링크를 붙여 넣으면 안의 폴더와 사진을 바로
              탐색할 수 있습니다.
            </p>
          </div>
        )}
      </dialog>
      <dialog
        className="studio-dialog"
        ref={dialog}
        onCancel={() => setModal(null)}
      >
        <div className="studio-dialog-heading">
          <div>
            <span>CONTENT HISTORY</span>
            <h2>
              {modal === "publish"
                ? "공개 사이트에 반영"
                : modal === "restore"
                  ? "체크포인트 복원 확인"
                  : modal === "rename"
                    ? "체크포인트 이름 변경"
                    : modal === "delete"
                      ? "체크포인트 삭제 확인"
                      : modal === "discard"
                        ? "저장하지 않은 변경 버리기"
                        : "체크포인트"}
            </h2>
          </div>
          <button
            className="studio-icon"
            aria-label="창 닫기"
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
        </div>
        {modal === "publish" ? (
          <>
            <p>
              현재 초안을 공개 사이트에 반영합니다. 다른 기기에서도 변경된 내용을 볼 수 있습니다.
            </p>
            <p>반영 전 공개 상태를 체크포인트로 자동 보관합니다.</p>
            <button
              className="studio-primary"
              disabled={busy}
              onClick={async () => {
                const backup = {
                  id: crypto.randomUUID(),
                  name: "반영 전 공개 상태",
                  createdAt: new Date().toISOString(),
                  values: { ...workspace.published },
                };
                if (
                  await persist(
                    {
                      ...workspace,
                      draft,
                      published: { ...draft },
                      checkpoints: [backup, ...workspace.checkpoints],
                    },
                    "공개 사이트에 반영했습니다.",
                  )
                )
                  setModal(null);
              }}
            >
              공개 적용 확인
            </button>
          </>
        ) : modal === "restore" && previewCheckpoint ? (
          <div className="studio-restore-confirm">
            <span>RESTORE CHECKPOINT</span>
            <h3>“{previewCheckpoint.name}” 상태로 초안을 바꿀까요?</h3>
            <p>
              현재 초안은 <strong>“복원 직전 자동 백업”</strong>으로 안전하게
              보관됩니다. 방문객에게 공개된 화면은 바뀌지 않습니다.
            </p>
            <div>
              <button
                className="studio-secondary"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                취소
              </button>
              <button
                className="studio-primary"
                disabled={busy}
                onClick={() => void restore(previewCheckpoint)}
              >
                이 버전으로 복원
              </button>
            </div>
          </div>
        ) : modal === "rename" && checkpointTarget ? (
          <div className="studio-restore-confirm">
            <span>RENAME CHECKPOINT</span>
            <h3>체크포인트 이름</h3>
            <input
              aria-label="새 체크포인트 이름"
              maxLength={80}
              value={checkpointName}
              onChange={(event) => setCheckpointName(event.target.value)}
            />
            <div>
              <button
                className="studio-secondary"
                onClick={() => setModal(null)}
              >
                취소
              </button>
              <button
                className="studio-primary"
                disabled={!checkpointName.trim() || busy}
                onClick={() => void renameCheckpoint()}
              >
                이름 저장
              </button>
            </div>
          </div>
        ) : modal === "delete" && checkpointTarget ? (
          <div className="studio-restore-confirm">
            <span>DELETE CHECKPOINT</span>
            <h3>“{checkpointTarget.name}”을 삭제할까요?</h3>
            <p>
              이 체크포인트 사본만 삭제됩니다. 현재 초안과 방문객 화면은 바뀌지
              않습니다.
            </p>
            <div>
              <button
                className="studio-secondary"
                onClick={() => setModal(null)}
              >
                취소
              </button>
              <button
                className="studio-danger"
                disabled={busy}
                onClick={() => void deleteCheckpoint()}
              >
                체크포인트 삭제
              </button>
            </div>
          </div>
        ) : modal === "discard" ? (
          <div className="studio-restore-confirm">
            <span>DISCARD UNSAVED CHANGES</span>
            <h3>저장하지 않은 변경을 버릴까요?</h3>
            <p>
              마지막으로 저장한 초안으로 돌아갑니다. 현재 편집 중인 변경은
              복구할 수 없습니다.
            </p>
            <div>
              <button
                className="studio-secondary"
                onClick={() => setModal(null)}
              >
                취소
              </button>
              <button className="studio-danger" onClick={discardUnsavedChanges}>
                변경 버리기
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>
              이름을 붙여 현재 상태를 보관하고, 이전 상태를 검토한 뒤 초안으로
              복원하세요.
            </p>
            <div className="studio-checkpoint-form">
              <input
                aria-label="체크포인트 이름"
                maxLength={80}
                value={checkpointName}
                placeholder="예: 가을 이벤트 시작 전"
                onChange={(e) => setCheckpointName(e.target.value)}
              />
              <button
                className="studio-primary"
                disabled={
                  !checkpointName.trim() ||
                  busy ||
                  !loaded ||
                  !!previewCheckpoint
                }
                onClick={() => void checkpoint()}
              >
                <Plus size={15} /> 저장
              </button>
            </div>
            <div className="studio-checkpoints">
              {workspace.checkpoints.map((point) => (
                <article key={point.id}>
                  <History size={18} />
                  <div>
                    <h3>{point.name}</h3>
                    <p>
                      {timeLabel(point.createdAt)} ·{" "}
                      {Object.keys(point.values).length}개 사용자 지정 항목
                    </p>
                  </div>
                  <button
                    className="studio-secondary"
                    onClick={() => enterPreview(point)}
                  >
                    검토
                  </button>
                  <button
                    className="studio-icon"
                    aria-label={`${point.name} 이름 변경`}
                    onClick={() => {
                      setCheckpointTarget(point);
                      setCheckpointName(point.name);
                      setModal("rename");
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="studio-icon studio-danger-icon"
                    aria-label={`${point.name} 삭제`}
                    onClick={() => {
                      setCheckpointTarget(point);
                      setModal("delete");
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    className="studio-secondary"
                    disabled={busy}
                    onClick={() => {
                      setPreviewCheckpoint(point);
                      setModal("restore");
                    }}
                  >
                    복원…
                  </button>
                </article>
              ))}
              {!workspace.checkpoints.length && (
                <div className="studio-checkpoints-empty">
                  <History size={30} />
                  <p>아직 저장된 체크포인트가 없습니다.</p>
                </div>
              )}
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}
