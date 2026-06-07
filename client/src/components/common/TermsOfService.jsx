import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">{t('termsOfService.title')}</h1>

        <div className="space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.acceptance.title')}
            </h2>
            <p>{t('termsOfService.sections.acceptance.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.accounts.title')}
            </h2>
            <p>{t('termsOfService.sections.accounts.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.courseAccess.title')}
            </h2>
            <p>{t('termsOfService.sections.courseAccess.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.instructorResponsibilities.title')}
            </h2>
            <p>
              {t('termsOfService.sections.instructorResponsibilities.body')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.payments.title')}
            </h2>
            <p>{t('termsOfService.sections.payments.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.prohibitedConduct.title')}
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>{t('termsOfService.sections.prohibitedConduct.item1')}</li>
              <li>{t('termsOfService.sections.prohibitedConduct.item2')}</li>
              <li>{t('termsOfService.sections.prohibitedConduct.item3')}</li>
              <li>{t('termsOfService.sections.prohibitedConduct.item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.accountTermination.title')}
            </h2>
            <p>{t('termsOfService.sections.accountTermination.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.changes.title')}
            </h2>
            <p>{t('termsOfService.sections.changes.body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              {t('termsOfService.sections.contact.title')}
            </h2>
            <p>{t('termsOfService.sections.contact.body')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
