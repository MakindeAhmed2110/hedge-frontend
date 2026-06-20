function MarketCardSkeleton() {
  return (
    <article className="market-card-skeleton" aria-hidden>
      <div className="market-card-skeleton__header">
        <div className="market-card-skeleton__icon" />
        <div className="market-card-skeleton__copy">
          <div className="market-card-skeleton__line market-card-skeleton__line--title" />
          <div className="market-card-skeleton__line market-card-skeleton__line--sub" />
        </div>
      </div>
      <div className="market-card-skeleton__meta">
        <div className="market-card-skeleton__line market-card-skeleton__line--pct" />
        <div className="market-card-skeleton__line market-card-skeleton__line--live" />
      </div>
      <div className="market-card-skeleton__actions">
        <div className="market-card-skeleton__btn" />
        <div className="market-card-skeleton__btn" />
      </div>
    </article>
  );
}

function MarketCardMobileSkeleton() {
  return (
    <article className="market-card-skeleton market-card-skeleton--mobile" aria-hidden>
      <div className="market-card-skeleton__cover" />
      <div className="market-card-skeleton__body">
        <div className="market-card-skeleton__line market-card-skeleton__line--title" />
        <div className="market-card-skeleton__line market-card-skeleton__line--sub" />
        <div className="market-card-skeleton__actions">
          <div className="market-card-skeleton__btn market-card-skeleton__btn--wide" />
          <div className="market-card-skeleton__btn market-card-skeleton__btn--wide" />
        </div>
      </div>
    </article>
  );
}

const SKELETON_COUNT = 6;

export function MarketGridSkeleton() {
  return (
    <>
      <div className="market-list-mobile flex flex-col gap-4" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <MarketCardMobileSkeleton key={i} />
        ))}
      </div>
      <div className="market-grid-desktop" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
