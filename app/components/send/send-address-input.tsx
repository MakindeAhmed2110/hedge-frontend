type SendAddressInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SendAddressInput({
  value,
  onChange,
  placeholder = "Enter Sui address",
}: SendAddressInputProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="send-address-input">
      <span className="send-address-input__label">To</span>
      <span className="send-address-input__sep" aria-hidden />
      <input
        type="text"
        className="send-address-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {hasValue ? (
        <button
          type="button"
          className="send-address-input__clear"
          onClick={() => onChange("")}
          aria-label="Clear address">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#E5E7EB" />
            <path d="M9 9l6 6M15 9l-6 6" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
