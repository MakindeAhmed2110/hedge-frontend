/** Compact stacked glass cards — matches promo reference proportions. */
export function HedgeLpPromoIcon() {
  return (
    <svg
      className="hedge-lp-promo-icon"
      width="28"
      height="22"
      viewBox="0 0 56 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      <defs>
        <linearGradient id="hlp-back" x1="0" y1="16" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#134E8C" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="hlp-mid" x1="10" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" />
          <stop offset="0.5" stopColor="#2563EB" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="hlp-front" x1="18" y1="2" x2="54" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="0.4" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="hlp-shine" x1="20" y1="4" x2="40" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.65" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id="hlp-soft-shadow" x="14" y="0" width="44" height="44" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4C1D95" floodOpacity="0.2" />
        </filter>
      </defs>

      <rect x="1" y="16" width="24" height="28" rx="6" fill="url(#hlp-back)" />
      <path d="M3 18 H20" stroke="white" strokeOpacity="0.2" strokeWidth="1.2" strokeLinecap="round" />

      <rect x="9" y="10" width="26" height="30" rx="7" fill="url(#hlp-mid)" />
      <path d="M11 13 H30" stroke="white" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />

      <g filter="url(#hlp-soft-shadow)">
        <rect x="17" y="3" width="32" height="36" rx="8" fill="url(#hlp-front)" />
        <rect x="17" y="3" width="32" height="36" rx="8" fill="url(#hlp-shine)" />
        <rect x="17" y="3" width="32" height="36" rx="8" stroke="white" strokeOpacity="0.28" />
      </g>
      <path d="M20 7 H42" stroke="white" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
