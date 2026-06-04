import { useTranslation } from "react-i18next";

function EarnRow({
  icon,
  title,
  description,
}: {
  icon: "link" | "people" | "star";
  title: string;
  description: string;
}) {
  return (
    <div className="referral-earn-row">
      <span className="referral-earn-row__icon" aria-hidden>
        {icon === "link" ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M14 11a5 5 0 00-7.07 0L5.52 12.41a5 5 0 007.07 7.07L14 19"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : icon === "people" ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M12 11a4 4 0 100-8 4 4 0 000 8zm8 9v-1a3 3 0 00-2-2.83M4 20v-1a3 3 0 012-2.83"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3l2.09 6.26H21l-5.17 3.76L17.91 21 12 16.77 6.09 21l2.08-6.98L3 9.26h6.91L12 3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="referral-earn-row__copy">
        <p className="referral-earn-row__title m-0">{title}</p>
        <p className="referral-earn-row__body m-0">{description}</p>
      </div>
    </div>
  );
}

export function ReferralEarnPoints() {
  const { t } = useTranslation();

  return (
    <section className="referral-earn-section">
      <h2 className="referral-earn-section__title">{t("referrals.howToEarnTitle")}</h2>
      <div className="glass-card referral-earn-card">
        <EarnRow
          icon="link"
          title={t("referrals.howToEarnShareTitle")}
          description={t("referrals.howToEarnShareBody")}
        />
        <div className="referral-earn-divider" />
        <EarnRow
          icon="people"
          title={t("referrals.howToEarnFriendsTitle")}
          description={t("referrals.howToEarnFriendsBody")}
        />
        <div className="referral-earn-divider" />
        <EarnRow
          icon="star"
          title={t("referrals.howToEarnPointsTitle")}
          description={t("referrals.howToEarnPointsBody")}
        />
      </div>
    </section>
  );
}
