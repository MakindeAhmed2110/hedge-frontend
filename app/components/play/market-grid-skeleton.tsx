const SKELETON_COUNT = 6;

export function MarketGridSkeleton() {
  return (
    <>
      <div className="market-list-mobile flex flex-col gap-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="market-skeleton market-skeleton--mobile" />
        ))}
      </div>
      <div className="market-grid-desktop" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="market-skeleton market-skeleton--poly" />
        ))}
      </div>
    </>
  );
}
