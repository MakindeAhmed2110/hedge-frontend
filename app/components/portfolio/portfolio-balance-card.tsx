import { useState, type ReactNode } from "react";

import {
  BuyIcon,
  QrCodeIcon,
  SendIcon,
  SwapIcon,
} from "~/components/portfolio/portfolio-action-icons";
import { PortfolioChart } from "~/components/portfolio/portfolio-chart";
import { HedgeColors } from "~/constants/brand";
import {
  CHART_HEIGHT_COMPACT,
  CHART_HEIGHT_FULL,
  CHART_PERIODS,
  type BalanceChartPoint,
  type ChartPeriod,
} from "~/lib/portfolio/balance-history";

const ACTION_MUTED = "#9CA3AF";

export type PortfolioBalanceCardData = {
  label: string;
  network: string;
  balance: string;
  tokenIcon?: string;
  onTokenPress?: () => void;
};

export type PortfolioBalanceCardAnalytics = {
  chartData: BalanceChartPoint[];
  changeAmount: string;
  changePercent: string;
  isPositive: boolean;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (period: ChartPeriod) => void;
  isCompactChart?: boolean;
};

type PortfolioBalanceCardProps = {
  card: PortfolioBalanceCardData;
  analytics?: PortfolioBalanceCardAnalytics;
  onReceivePress?: () => void;
  onSendPress?: () => void;
};

export function PortfolioBalanceCard({
  card,
  analytics,
  onReceivePress,
  onSendPress,
}: PortfolioBalanceCardProps) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const displayBalance = balanceHidden ? "••••••" : card.balance;

  return (
    <section className="portfolio-balance-card">
      <div className="portfolio-balance-card__top">
        <span className="portfolio-balance-card__label">{card.label}</span>
        <button
          type="button"
          className="portfolio-balance-card__pill"
          onClick={card.onTokenPress}
          disabled={!card.onTokenPress}>
          {card.tokenIcon ? (
            <img src={card.tokenIcon} alt="" className="portfolio-balance-card__pill-icon" />
          ) : (
            <span className="portfolio-balance-card__pill-dot" aria-hidden />
          )}
          <span>{card.network}</span>
          {card.onTokenPress ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : null}
        </button>
      </div>

      <div className="portfolio-balance-card__balance-row">
        <p className="portfolio-balance-card__balance">{displayBalance}</p>
        <button
          type="button"
          className="portfolio-balance-card__eye"
          onClick={() => setBalanceHidden((v) => !v)}
          aria-label={balanceHidden ? "Show balance" : "Hide balance"}>
          {balanceHidden ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3l18 18M10.5 10.677a2.5 2.5 0 003.346 3.346M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.512 5.237 6 9 6 1.55 0 3.043-.523 4.395-1.35M13.5 13.677a2.5 2.5 0 01-3.346-3.346"
                stroke="#9CA3AF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                stroke="#9CA3AF"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>

      {analytics ? (
        <>
          <div className="portfolio-balance-card__change-row">
            {balanceHidden ? (
              <span className="portfolio-balance-card__change-hidden">••••••</span>
            ) : (
              <>
                <span
                  className={
                    analytics.isPositive
                      ? "portfolio-balance-card__change portfolio-balance-card__change--up"
                      : "portfolio-balance-card__change portfolio-balance-card__change--down"
                  }>
                  {analytics.changeAmount}
                </span>
                <span
                  className={
                    analytics.isPositive
                      ? "portfolio-balance-card__change-pill portfolio-balance-card__change-pill--up"
                      : "portfolio-balance-card__change-pill portfolio-balance-card__change-pill--down"
                  }>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    {analytics.isPositive ? (
                      <path d="M4 16l6-8 4 5 6-9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
                    ) : (
                      <path d="M4 8l6 8 4-5 6 9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                    )}
                  </svg>
                  {analytics.changePercent}
                </span>
              </>
            )}
          </div>

          {!balanceHidden ? (
            <div
              className={
                analytics.isCompactChart
                  ? "portfolio-balance-card__chart portfolio-balance-card__chart--compact"
                  : "portfolio-balance-card__chart"
              }>
              <PortfolioChart
                data={analytics.chartData}
                height={analytics.isCompactChart ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_FULL}
                compact={analytics.isCompactChart}
                lineColor={HedgeColors.primary}
              />
            </div>
          ) : (
            <div
              className="portfolio-balance-card__chart-placeholder"
              style={{
                height: analytics.isCompactChart ? CHART_HEIGHT_COMPACT : CHART_HEIGHT_FULL,
              }}
            />
          )}

          <div className="portfolio-balance-card__periods">
            {CHART_PERIODS.map((item) => {
              const active = analytics.chartPeriod === item;
              return (
                <button
                  key={item}
                  type="button"
                  className={
                    active
                      ? "portfolio-balance-card__period portfolio-balance-card__period--active"
                      : "portfolio-balance-card__period"
                  }
                  onClick={() => analytics.onChartPeriodChange(item)}>
                  {item}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="portfolio-balance-card__actions">
        <ActionButton icon={<QrCodeIcon />} label="Receive" onPress={onReceivePress} />
        <ActionButton icon={<SendIcon />} label="Send" onPress={onSendPress} />
        <ActionButton icon={<SwapIcon />} label="Swap" disabled showClock />
        <ActionButton icon={<BuyIcon />} label="Buy" />
      </div>
    </section>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  showClock,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  showClock?: boolean;
  onPress?: () => void;
}) {
  return (
    <button
      type="button"
      className={
        disabled
          ? "portfolio-balance-card__action portfolio-balance-card__action--disabled"
          : "portfolio-balance-card__action"
      }
      disabled={disabled}
      onClick={onPress}>
      <span
        className={
          disabled
            ? "portfolio-balance-card__action-icon portfolio-balance-card__action-icon--muted"
            : "portfolio-balance-card__action-icon"
        }>
        {icon}
        {showClock ? (
          <span className="portfolio-balance-card__action-badge" aria-hidden>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={ACTION_MUTED} strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke={ACTION_MUTED} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        ) : null}
      </span>
      <span className={disabled ? "portfolio-balance-card__action-label--muted" : undefined}>
        {label}
      </span>
    </button>
  );
}
