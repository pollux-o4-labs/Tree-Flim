import { useState } from "react";
import { ArrowUp } from "lucide-react";

type FloatingUtilityBubbleProps = {
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
};

function ThemeArtwork({ theme }: { theme: "light" | "dark" }) {
  return (
    <svg
      className="theme-artwork"
      data-theme={theme}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle className="theme-artwork-halo" cx="24" cy="24" r="16" />
      <path
        className="theme-artwork-shadow"
        d="M31.8 8.7c-5.8 2.6-9.5 8.2-9.5 14.7 0 7.1 4.8 13.3 11.6 15.3A16.7 16.7 0 1 1 31.8 8.7Z"
      />
      <path
        className="theme-artwork-mark"
        d="M11.8 29.5c3.2-2.1 6.6-2.7 10.1-1.8 3.2.8 5.8 2.7 8.1 5.6"
      />
      <circle className="theme-artwork-dot" cx="14" cy="16" r="1.6" />
    </svg>
  );
}

export default function FloatingUtilityBubble({
  theme,
  onToggleTheme,
}: FloatingUtilityBubbleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={"floating-utility" + (open ? " open" : "")}>
      <div className="floating-menu" aria-label="화면 도구">
        {onToggleTheme && theme && (
          <button
            className="floating-action floating-theme-action"
            type="button"
            aria-label={theme === "dark" ? "라이트 테마로 전환" : "다크 테마로 전환"}
            onClick={() => {
              onToggleTheme();
              setOpen(false);
            }}
          >
            <ThemeArtwork theme={theme} />
          </button>
        )}
        <button
          className="floating-action floating-top-action"
          type="button"
          aria-label="맨 위로 이동"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setOpen(false);
          }}
        >
          <ArrowUp size={17} />
          <span>TOP</span>
        </button>
      </div>
      <button
        className="floating-trigger"
        type="button"
        aria-label={open ? "화면 도구 닫기" : "화면 도구 열기"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="16" />
          <path d="M17 24h14M24 17v14" />
        </svg>
      </button>
    </div>
  );
}
