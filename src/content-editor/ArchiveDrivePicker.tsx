import PreviewImage from '../shared/PreviewImage';
import { Check, ChevronRight, FolderOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  listPublicDriveFolder,
  portfolioDriveRoot,
  type DriveTrailItem,
  type PublicDriveItem,
} from "./publicDrive";

type Props = {
  open: boolean;
  initialCategory: string;
  onClose: () => void;
  onImport: (items: PublicDriveItem[], category: string) => void;
  onError: (message: string) => void;
};

export default function ArchiveDrivePicker({
  open,
  initialCategory,
  onClose,
  onImport,
  onError,
}: Props) {
  const [url, setUrl] = useState(portfolioDriveRoot),
    [items, setItems] = useState<PublicDriveItem[]>([]),
    [trail, setTrail] = useState<DriveTrailItem[]>([]),
    [loading, setLoading] = useState(false),
    [selected, setSelected] = useState<Record<string, PublicDriveItem>>({}),
    [category, setCategory] = useState(initialCategory);
  useEffect(() => {
    if (open) {
      setUrl(
        localStorage.getItem("tree-film:drive-root") ?? portfolioDriveRoot,
      );
      setCategory(initialCategory);
    }
  }, [open, initialCategory]);
  if (!open) return null;
  async function openFolder(value = url, nextTrail?: DriveTrailItem[]) {
    setLoading(true);
    try {
      const result = await listPublicDriveFolder(value),
        resolvedTrail = nextTrail ?? [
          { id: result.folderId, name: "포트폴리오" },
        ];
      setItems(result.items);
      setTrail(resolvedTrail);
      setUrl(value);
      if (!nextTrail) localStorage.setItem("tree-film:drive-root", value);
      setCategory(
        resolvedTrail.length > 1 ? resolvedTrail.at(-1)!.name : initialCategory,
      );
    } catch (reason) {
      onError(
        reason instanceof Error ? reason.message : "폴더를 열지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }
  function toggle(item: PublicDriveItem) {
    setSelected((current) => {
      const next = { ...current };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });
  }
  const picked = Object.values(selected),
    hasPhotos = items.some((item) => item.kind === "image");
  return (
    <div className="archive-drive-backdrop" role="presentation">
      <section
        className="archive-drive-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Drive에서 사진 고르기"
      >
        <header>
          <div>
            <span>사진 가져오기</span>
            <h2>
              {trail.length
                ? "촬영 폴더에서 고르세요"
                : "포트폴리오 폴더를 연결하세요"}
            </h2>
          </div>
          <button
            className="archive-icon"
            aria-label="사진 고르기 닫기"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="archive-drive-connect">
          <input
            aria-label="Google Drive 폴더 링크"
            placeholder="공개 Drive 폴더 링크 붙여넣기"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            className="archive-primary"
            disabled={!url.trim() || loading}
            onClick={() => void openFolder()}
          >
            {loading ? "여는 중…" : "폴더 연결"}
          </button>
        </div>
        {trail.length ? (
          <>
            <nav className="archive-drive-trail" aria-label="Drive 현재 위치">
              {trail.map((part, index) => (
                <button
                  key={part.id}
                  disabled={index === trail.length - 1}
                  onClick={() =>
                    void openFolder(part.id, trail.slice(0, index + 1))
                  }
                >
                  {part.name}
                </button>
              ))}
            </nav>
            <div className="archive-drive-content ui-scrollbar">
              <div className="archive-drive-grid">
                {items.map((item) =>
                  item.kind === "folder" ? (
                    <button
                      className="archive-drive-folder"
                      key={item.id}
                      onClick={() =>
                        void openFolder(item.id, [
                          ...trail,
                          { id: item.id, name: item.name },
                        ])
                      }
                    >
                      <FolderOpen size={24} />
                      <span>
                        <strong>{item.name}</strong>
                        <small>컬렉션으로 열기</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button
                      className="archive-drive-photo"
                      aria-pressed={Boolean(selected[item.id])}
                      key={item.id}
                      onClick={() => toggle(item)}
                    >
                      <PreviewImage previewWidth={320} src={item.thumbnailUrl} alt="" />
                      <span>{item.name}</span>
                      <i>
                        <Check size={14} />
                      </i>
                    </button>
                  ),
                )}
              </div>
            </div>
            <footer>
              <label>
                사이트 컬렉션 이름
                <input
                  aria-label="가져올 컬렉션"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </label>
              <div>
                {hasPhotos && (
                  <button
                    className="archive-secondary"
                    onClick={() =>
                      setSelected(
                        Object.fromEntries(
                          items
                            .filter(
                              (item) => item.kind === "image" && item.sourceUrl,
                            )
                            .map((item) => [item.id, item]),
                        ),
                      )
                    }
                  >
                    이 폴더 사진 전체 선택
                  </button>
                )}
                <strong>{picked.length}장 선택</strong>
                <button
                  className="archive-primary"
                  disabled={!picked.length}
                  onClick={() => onImport(picked, category)}
                >
                  선택한 사진 가져오기
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="archive-drive-empty">
            <FolderOpen size={32} />
            <strong>Drive 포트폴리오 폴더를 연결하세요</strong>
            <p>촬영 폴더를 그대로 보고, 필요한 사진만 초안으로 가져옵니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
