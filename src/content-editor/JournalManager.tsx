import { useUnsavedNavigation } from './useUnsavedNavigation';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Archive,
  Check,
  FileText,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import { newsPosts } from "../content/news";
import { readWorkspace, writeWorkspace, getCachedWorkspace } from "./repository";
import type {
  JournalRecord,
  RecordLifecycle,
  RecordStatus,
  Workspace,
} from "./model";
import "./journal-manager.css";

const categories = ["STUDIO", "SEASONAL", "EXHIBITION", "STORY"];
const labels: Record<RecordStatus, string> = {
  draft: "초안",
  published: "공개",
  archived: "보관",
  trashed: "휴지통",
};
const categoryLabels: Record<string, string> = {
  STUDIO: "스튜디오",
  SEASONAL: "계절 촬영",
  EXHIBITION: "전시",
  STORY: "촬영 이야기",
};
const lifecycleLabels: Record<RecordLifecycle, string> = {
  upcoming: "예정",
  ongoing: "진행 중",
  ended: "종료",
};
const stamp = () => new Date().toISOString();
const copy = (items: JournalRecord[]) => structuredClone(items);

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`record-status ${status}`}>{labels[status]}</span>;
}
function blankRecord(): JournalRecord {
  const now = stamp();
  return {
    id: `record-${crypto.randomUUID().slice(0, 8)}`,
    category: "STORY",
    title: "제목 없는 소식",
    subtitle: "",
    summary: "",
    image: "",
    imageAlt: "",
    paragraphs: [""],
    eventStatus: "upcoming",
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
}

export default function JournalManager() {
  const [workspace, setWorkspace] = useState<Workspace | null>(getCachedWorkspace);
  const [records, setRecords] = useState<JournalRecord[]>(() => getCachedWorkspace()?.newsDraft?.length ? getCachedWorkspace()!.newsDraft! : copy(newsPosts));
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<RecordStatus | "all">("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [markdown, setMarkdown] = useState("");
  const preview = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    void readWorkspace()
      .then((value) => {
        const items = value.newsDraft?.length
          ? value.newsDraft
          : copy(newsPosts);
        setWorkspace(value);
        setRecords(items);
        setSelectedId(items[0]?.id ?? "");
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "소식을 불러오지 못했습니다.",
        ),
      );
  }, []);
  const selected = records.find((item) => item.id === selectedId);
  const visible = useMemo(
    () =>
      records
        .filter((item) => filter === "all" || item.status === filter)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [records, filter],
  );
  const dirty = workspace
    ? JSON.stringify(records) !==
      JSON.stringify(
        workspace.newsDraft?.length ? workspace.newsDraft : newsPosts,
      )
    : false;
  const syncPreview = () =>
    preview.current?.contentWindow?.postMessage(
      { source: "tree-film-record-manager", type: "records-sync", records },
      location.origin,
    );
  useEffect(() => {
    syncPreview();
  }, [records, selectedId]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === preview.current?.contentWindow &&
        event.data?.source === "tree-film-record-preview"
      )
        syncPreview();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  });
  const replace = (next: JournalRecord[]) => {
    setRecords(next);
    setMessage("");
    setError("");
  };
  const update = (patch: Partial<JournalRecord>) =>
    selected &&
    replace(
      records.map((item) =>
        item.id === selected.id
          ? { ...item, ...patch, updatedAt: stamp() }
          : item,
      ),
    );
  const updateParagraph = (index: number, value: string) =>
    selected &&
    update({
      paragraphs: selected.paragraphs.map((item, i) =>
        i === index ? value : item,
      ),
    });
  async function persist(
    next = records,
    publish = false,
    success = "초안을 저장했습니다. 방문객에게는 아직 보이지 않습니다.",
  ) {
    if (!workspace || saving) return;
    setSaving(true);
    setError("");
    try {
      const saved = await writeWorkspace({
        ...workspace,
        newsDraft: next,
        ...(publish ? { newsPublished: next } : {}),
      });
      setWorkspace(saved);
      setRecords(next);
      setMessage(success);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }
  useUnsavedNavigation(dirty);
  function create() {
    const item = blankRecord();
    replace([item, ...records]);
    setSelectedId(item.id);
    setFilter("all");
  }
  function applyMarkdown() {
    if (!selected || !markdown.trim()) return;
    update({
      paragraphs: markdown
        .trim()
        .split(/\n\s*\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setMarkdown("");
    setMessage("붙여 넣은 글을 본문에 적용했습니다. 실제 화면에서 확인하세요.");
  }
  async function changeStatus(status: RecordStatus) {
    if (!selected) return;
    const now = stamp();
    const next = records.map((item) =>
      item.id === selected.id
        ? {
            ...item,
            status,
            featured: status === "published" ? item.featured : false,
            publishedAt:
              status === "published"
                ? (item.publishedAt ?? now)
                : item.publishedAt,
            updatedAt: now,
          }
        : item,
    );
    await persist(
      next,
      true,
      status === "published"
        ? "소식을 공개했습니다. 방문객 화면에 표시됩니다."
        : status === "trashed"
          ? "휴지통으로 옮겼습니다. 필요하면 복원할 수 있습니다."
          : status === "archived"
            ? "소식을 보관했습니다. 방문객에게는 더 이상 보이지 않습니다."
            : "초안으로 복원했습니다.",
    );
  }
  return (
    <main className="journal-manager">
      <header className="journal-topbar">
        <Link to="/admin/content">
          <ArrowLeft size={17} /> 사이트 관리
        </Link>
        <div>
          <span>사이트 관리</span>
          <h1>소식</h1>
        </div>
        <div className="journal-top-actions">
          <Link className="journal-secondary" to="/admin/content/archive">
            아카이브
          </Link>
          <button
            className="journal-secondary"
            disabled={!dirty || saving}
            onClick={() => void persist()}
          >
            <Save size={15} /> 초안 저장
          </button>
          <button className="journal-primary" onClick={create}>
            <Plus size={16} /> 새 소식
          </button>
        </div>
      </header>
      <div className="journal-layout">
        <aside className="journal-list" aria-label="소식 목록">
          <div className="journal-list-heading">
            <div>
              <span>소식 목록</span>
              <strong>{records.length}개 소식</strong>
            </div>
            <button
              className="journal-icon"
              aria-label="새 소식"
              onClick={create}
            >
              <Plus size={17} />
            </button>
          </div>
          <div
            className="journal-filters"
            role="tablist"
            aria-label="소식 상태"
          >
            {(
              ["all", "draft", "published", "archived", "trashed"] as const
            ).map((status) => (
              <button
                key={status}
                role="tab"
                aria-selected={filter === status}
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "전체" : labels[status]}
              </button>
            ))}
          </div>
          <div className="journal-items ui-scrollbar-desktop">
            {visible.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <div>
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                </div>
                <span>
                  <small>
                    {categoryLabels[item.category] ?? item.category}
                  </small>
                  <strong>{item.title || "제목 없는 소식"}</strong>
                  <em>
                    {new Date(item.updatedAt).toLocaleDateString("ko-KR")}
                  </em>
                </span>
                <RecordStatusBadge status={item.status} />
              </button>
            ))}
            {!visible.length && (
              <p className="journal-empty">이 상태의 소식이 없습니다.</p>
            )}
          </div>
        </aside>
        {selected ? (
          <section className="journal-editor" aria-label="소식 편집">
            <header>
              <div>
                <span>현재 편집 중</span>
                <h2>{selected.title || "제목 없는 소식"}</h2>
                <RecordStatusBadge status={selected.status} />
              </div>
              <div className="journal-editor-actions">
                {selected.status === "draft" && (
                  <button
                    className="journal-primary"
                    disabled={saving}
                    onClick={() => void changeStatus("published")}
                  >
                    <Check size={15} /> 공개하기
                  </button>
                )}
                {selected.status === "published" && (
                  <button
                    className="journal-secondary"
                    disabled={saving}
                    onClick={() => void changeStatus("archived")}
                  >
                    <Archive size={15} /> 보관
                  </button>
                )}
                {selected.status === "archived" && (
                  <button
                    className="journal-secondary"
                    disabled={saving}
                    onClick={() => void changeStatus("published")}
                  >
                    <Check size={15} /> 다시 공개
                  </button>
                )}
                {selected.status === "trashed" && (
                  <button
                    className="journal-secondary"
                    disabled={saving}
                    onClick={() => void changeStatus("draft")}
                  >
                    <Undo2 size={15} /> 초안으로 복원
                  </button>
                )}
                {selected.status !== "trashed" && (
                  <button
                    className="journal-icon danger"
                    aria-label="휴지통으로 이동"
                    disabled={saving}
                    onClick={() => void changeStatus("trashed")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </header>
            <div className="journal-editor-scroll ui-scrollbar">
              <div className="journal-form">
                <label>
                  제목
                  <input
                    aria-label="소식 제목"
                    value={selected.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </label>
                <fieldset className="journal-lifecycle">
                  <legend>행사 상태</legend>
                  {(["upcoming", "ongoing", "ended"] as const).map((item) => (
                    <button
                      type="button"
                      aria-pressed={
                        (selected.eventStatus ?? "upcoming") === item
                      }
                      key={item}
                      onClick={() => update({ eventStatus: item })}
                    >
                      {lifecycleLabels[item]}
                    </button>
                  ))}
                </fieldset>
                <label>
                  한 줄 소개
                  <input
                    aria-label="한 줄 소개"
                    value={selected.subtitle}
                    onChange={(e) => update({ subtitle: e.target.value })}
                  />
                </label>
                <label>
                  카드 요약
                  <textarea
                    aria-label="카드 요약"
                    value={selected.summary}
                    onChange={(e) => update({ summary: e.target.value })}
                    rows={3}
                  />
                </label>
                <div className="journal-form-row">
                  <label>
                    분류
                    <select
                      aria-label="소식 분류"
                      value={selected.category}
                      onChange={(e) => update({ category: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="journal-feature">
                    <input
                      type="checkbox"
                      checked={selected.featured}
                      onChange={(e) => update({ featured: e.target.checked })}
                    />{" "}
                    홈에 우선 표시
                  </label>
                </div>
                <section className="journal-media">
                  <div>
                    <span>대표 사진</span>
                    <p>
                      공개 이미지 주소 또는 Drive 사진의 직접 주소를 넣으세요.
                    </p>
                  </div>
                  <label>
                    사진 주소
                    <input
                      aria-label="대표 사진 주소"
                      type="url"
                      placeholder="https://…"
                      value={selected.image}
                      onChange={(e) => update({ image: e.target.value })}
                    />
                  </label>
                  <label>
                    사진 설명
                    <input
                      aria-label="대표 사진 설명"
                      value={selected.imageAlt}
                      onChange={(e) => update({ imageAlt: e.target.value })}
                    />
                  </label>
                </section>
                <section className="journal-body">
                  <div className="journal-section-heading">
                    <div>
                      <span>본문</span>
                      <h3>글 내용</h3>
                    </div>
                    <button
                      className="journal-secondary"
                      onClick={() =>
                        update({ paragraphs: [...selected.paragraphs, ""] })
                      }
                    >
                      <Plus size={14} /> 문단 추가
                    </button>
                  </div>
                  <details className="journal-markdown">
                    <summary>
                      ChatGPT 글 붙여넣기 <small>마크다운 가능</small>
                    </summary>
                    <p>
                      제목은 위 입력칸에서, 본문은 아래에 붙여 넣으세요.{" "}
                      <code>**강조**</code>, <code>*기울임*</code>, 링크,{" "}
                      <code># 소제목</code>, 목록을 실제 화면에 반영합니다.
                    </p>
                    <textarea
                      aria-label="마크다운 본문"
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      placeholder="ChatGPT에서 만든 글을 여기에 붙여 넣으세요."
                      rows={8}
                    />
                    <button
                      className="journal-secondary"
                      disabled={!markdown.trim()}
                      onClick={applyMarkdown}
                    >
                      본문에 적용
                    </button>
                  </details>
                  {selected.paragraphs.map((paragraph, index) => (
                    <div
                      className="journal-paragraph"
                      key={`${selected.id}-${index}`}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <textarea
                        aria-label={`본문 문단 ${index + 1}`}
                        value={paragraph}
                        onChange={(e) => updateParagraph(index, e.target.value)}
                        rows={5}
                      />
                      <button
                        className="journal-icon danger"
                        aria-label={`${index + 1}번 문단 삭제`}
                        disabled={selected.paragraphs.length === 1}
                        onClick={() =>
                          update({
                            paragraphs: selected.paragraphs.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </section>
              </div>
              <aside className="journal-preview">
                <span>실제 방문객 화면</span>
                <div className="journal-preview-frame">
                  <iframe
                    ref={preview}
                    key={selected.id}
                    title="소식 실제 화면 미리보기"
                    src={`${import.meta.env.BASE_URL}prototype/total?editor=1&news=${selected.id}`}
                    onLoad={syncPreview}
                  />
                </div>
                <p>
                  이 화면은 현재 초안을 렌더링합니다. 공개 전에도 실제 기사
                  형태를 확인할 수 있습니다.
                </p>
              </aside>
            </div>
          </section>
        ) : (
          <section className="journal-no-selection">
            <FileText size={28} />
            <h2>소식을 선택하거나 새로 만드세요.</h2>
          </section>
        )}
      </div>
      {(message || error) && (
        <div
          className={`journal-toast${error ? " error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error || message}
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
