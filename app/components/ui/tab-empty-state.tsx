type TabEmptyStateProps = {
  title: string;
  message: string;
  icon?: "wallet" | "time" | "cloud" | "search" | "calendar" | "pulse";
  /** Card style matching my-app feature placeholders. */
  variant?: "default" | "card";
};

function EmptyIcon({
  icon,
  stroke = "#9CA3AF",
}: {
  icon: NonNullable<TabEmptyStateProps["icon"]>;
  stroke?: string;
}) {
  if (icon === "wallet") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 8h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM4 8V6a2 2 0 012-2h12a2 2 0 012 2v2"
          stroke={stroke}
          strokeWidth="1.8"
        />
      </svg>
    );
  }
  if (icon === "time") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "search") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth="1.8" />
        <path d="M20 20l-3-3" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "pulse") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12h4l2-7 4 14 2-7h8"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === "calendar") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke={stroke} strokeWidth="1.8" />
        <path d="M8 3v4M16 3v4M4 10h16" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4zM8 10v4M12 10v4M16 10v4"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TabEmptyState({
  title,
  message,
  icon = "time",
  variant = "default",
}: TabEmptyStateProps) {
  const iconStroke = variant === "card" ? "var(--color-hedge-primary)" : "#9CA3AF";

  return (
    <div
      className={
        variant === "card" ? "tab-empty-state tab-empty-state--card" : "tab-empty-state"
      }>
      <span className="tab-empty-state__icon" aria-hidden>
        <EmptyIcon icon={icon} stroke={iconStroke} />
      </span>
      <p className="tab-empty-state__title">{title}</p>
      <p className="tab-empty-state__message">{message}</p>
    </div>
  );
}
