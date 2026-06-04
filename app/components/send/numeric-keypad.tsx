const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
] as const;

type NumericKeypadProps = {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
};

export function NumericKeypad({ onKeyPress, onBackspace, onClear }: NumericKeypadProps) {
  return (
    <div className="numeric-keypad">
      {KEYS.map((row) => (
        <div key={row.join("-")} className="numeric-keypad__row">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className="numeric-keypad__key"
              onClick={() => {
                if (key === "backspace") onBackspace();
                else onKeyPress(key);
              }}
              onContextMenu={(e) => {
                if (key === "backspace" && onClear) {
                  e.preventDefault();
                  onClear();
                }
              }}>
              {key === "backspace" ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 8h12l-2 10H8L6 8zM9 11v4M12 11v4M15 11v4"
                    stroke="#121212"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <span>{key}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
