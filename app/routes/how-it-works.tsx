import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import { HedgePageModalShell } from "~/components/layout/hedge-page-modal-shell";

export default function HowItWorksRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    { title: t("howItWorks.step1Title"), body: t("howItWorks.step1Body") },
    { title: t("howItWorks.step2Title"), body: t("howItWorks.step2Body") },
    { title: t("howItWorks.step3Title"), body: t("howItWorks.step3Body") },
  ];

  return (
    <HedgePageModalShell title={t("howItWorks.title")} subtitle={t("howItWorks.subtitle")}>
      <div className="how-it-works">
        <section className="how-it-works__steps">
          <h2 className="how-it-works__section-title">{t("howItWorks.stepsTitle")}</h2>
          <ol className="how-it-works__step-list">
            {steps.map((step, index) => (
              <li key={step.title} className="how-it-works__step">
                <span className="how-it-works__step-num">{index + 1}</span>
                <div className="how-it-works__step-text">
                  <h3 className="how-it-works__step-title">{step.title}</h3>
                  <p className="how-it-works__step-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="how-it-works__cards">
          <section className="glass-card how-it-works__card">
            <div className="how-it-works__card-icon how-it-works__card-icon--hedge" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l7 3v5c0 4.42-3 7.5-7 9-4-1.5-7-4.58-7-9V6l7-3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="how-it-works__card-title">{t("howItWorks.hedgeTitle")}</h3>
            <p className="how-it-works__card-body">{t("howItWorks.hedgeBody")}</p>
            <Link to="/vaults" className="how-it-works__card-link">
              {t("howItWorks.hedgeCta")} →
            </Link>
          </section>

          <section className="glass-card how-it-works__card">
            <div className="how-it-works__card-icon how-it-works__card-icon--points" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l2.7 5.5 6 .9-4.35 4.2 1.03 6L12 16.8 6.62 19.6l1.03-6L3.3 9.4l6-.9L12 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="how-it-works__card-title">{t("howItWorks.pointsTitle")}</h3>
            <p className="how-it-works__card-body">{t("howItWorks.pointsBody")}</p>
            <Link to="/leaderboard" className="how-it-works__card-link">
              {t("howItWorks.pointsCta")} →
            </Link>
          </section>
        </div>

        <button
          type="button"
          className="how-it-works__cta"
          onClick={() => navigate("/play")}>
          {t("howItWorks.ctaPrimary")}
        </button>

        <p className="how-it-works__note">{t("howItWorks.betaNote")}</p>
      </div>
    </HedgePageModalShell>
  );
}
