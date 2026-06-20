import { useTranslation } from "react-i18next";

import { MarketFeedAvatar } from "~/components/play/market-feed-avatar";
import { formatMarketVolume } from "~/hooks/use-market-oracle-feed";
import type { MarketComment } from "~/lib/predict/types";

type MarketCommentsPanelProps = {
  comments: MarketComment[];
  volumeUsd: number;
  isLoading?: boolean;
};

export function MarketCommentsPanel({ comments, volumeUsd, isLoading }: MarketCommentsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="market-comments-panel">
      <div className="market-comments-panel__list">
        {isLoading && comments.length === 0 ? (
          <div className="market-comments-panel__loading" aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="market-comments-panel__skeleton">
                <span className="market-comments-panel__skeleton-avatar" />
                <span className="market-comments-panel__skeleton-lines">
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="market-comments-panel__empty">{t("play.tabChatEmpty")}</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="market-comments-panel__item">
              <MarketFeedAvatar seed={comment.authorAddress ?? comment.handle} />
              <p className="market-comments-panel__text">
                <strong>{comment.handle}</strong> {comment.body}
              </p>
            </article>
          ))
        )}
      </div>
      <footer className="market-comments-panel__footer">{formatMarketVolume(volumeUsd)}</footer>
    </div>
  );
}
