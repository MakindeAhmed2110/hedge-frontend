type AuthPillInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  prefix?: string;
  type?: "text" | "email";
  maxLength?: number;
};

export function AuthPillInput({
  value,
  onChange,
  placeholder,
  onSubmit,
  loading,
  disabled,
  prefix,
  type = "text",
  maxLength,
}: AuthPillInputProps) {
  const isDisabled = disabled || loading;

  return (
    <div className="auth-pill">
      {prefix ? <span className="auth-pill__prefix">{prefix}</span> : null}
      <input
        className="auth-pill__input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isDisabled}
        maxLength={maxLength}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isDisabled) onSubmit();
        }}
        autoComplete={type === "email" ? "email" : "off"}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <button
        type="button"
        className="auth-pill__submit"
        onClick={onSubmit}
        disabled={isDisabled}
        aria-label="Continue">
        {loading ? (
          <span className="auth-pill__spinner" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
