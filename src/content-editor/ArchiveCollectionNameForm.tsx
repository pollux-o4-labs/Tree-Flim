type ArchiveCollectionNameFormProps = {
  className: string;
  fieldId: string;
  label: string;
  value: string;
  submitLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  busy?: boolean;
  onCancel?: () => void;
};

/** Reusable name-entry form for creating and renaming archive collections. */
export default function ArchiveCollectionNameForm({
  className,
  fieldId,
  label,
  value,
  submitLabel,
  disabled,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  autoFocus = false,
  busy = false,
  onCancel,
}: ArchiveCollectionNameFormProps) {
  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && !busy) onSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onCancel && !busy) {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-label={ariaLabel ?? label}
        autoFocus={autoFocus}
        readOnly={busy}
        maxLength={40}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" disabled={disabled || busy}>
        {busy ? "저장 중…" : submitLabel}
      </button>
      {onCancel && (
        <button type="button" disabled={busy} onClick={onCancel}>
          취소
        </button>
      )}
    </form>
  );
}
