import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">{t('privacyPolicy.title')}</h1>

        <div className="space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.information.title')}
            </h2>
            <p>{t('privacyPolicy.sections.information.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.useInformation.title')}
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>{t('privacyPolicy.sections.useInformation.item1')}</li>
              <li>{t('privacyPolicy.sections.useInformation.item2')}</li>
              <li>{t('privacyPolicy.sections.useInformation.item3')}</li>
              <li>{t('privacyPolicy.sections.useInformation.item4')}</li>
              <li>{t('privacyPolicy.sections.useInformation.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.dataProtection.title')}
            </h2>
            <p>{t('privacyPolicy.sections.dataProtection.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.cookies.title')}
            </h2>
            <p>{t('privacyPolicy.sections.cookies.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.thirdParty.title')}
            </h2>
            <p>{t('privacyPolicy.sections.thirdParty.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.userRights.title')}
            </h2>
            <p>{t('privacyPolicy.sections.userRights.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.childrensPrivacy.title')}
            </h2>
            <p>{t('privacyPolicy.sections.childrensPrivacy.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.changes.title')}
            </h2>
            <p>{t('privacyPolicy.sections.changes.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('privacyPolicy.sections.contact.title')}
            </h2>
            <p>{t('privacyPolicy.sections.contact.body')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
