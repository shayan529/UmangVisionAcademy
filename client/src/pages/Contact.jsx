import React from 'react';
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Hero Section */}

      <section className="px-6 md:px-10 py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* Left Content */}

          <div>
            <p className="text-indigo-400 font-semibold mb-4">
              {t('contact.tag')}
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {t('contact.headline')}{' '}
              <span className="text-indigo-400">{t('contact.highlight')}</span>
            </h1>

            <p className="text-slate-400 mt-8 text-lg leading-relaxed">
              {t('contact.description')}
            </p>

            {/* Contact Cards */}

            <div className="grid sm:grid-cols-2 gap-5 mt-10">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h3 className="text-xl font-semibold">
                  {t('contact.supportCards.email.title')}
                </h3>

                <p className="text-slate-400 mt-3">
                  {t('contact.supportCards.email.detail')}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h3 className="text-xl font-semibold">
                  {t('contact.supportCards.phone.title')}
                </h3>

                <p className="text-slate-400 mt-3">
                  {t('contact.supportCards.phone.detail')}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h3 className="text-xl font-semibold">
                  {t('contact.supportCards.business.title')}
                </h3>

                <p className="text-slate-400 mt-3">
                  {t('contact.supportCards.business.detail')}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h3 className="text-xl font-semibold">
                  {t('contact.supportCards.hours.title')}
                </h3>

                <p className="text-slate-400 mt-3">
                  {t('contact.supportCards.hours.detail')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-2xl">
            <h2 className="text-3xl font-bold">{t('contact.form.title')}</h2>

            <p className="text-slate-400 mt-3">{t('contact.form.subtitle')}</p>

            <form className="space-y-6 mt-10">
              {/* Name */}

              <div>
                <label className="text-sm text-slate-300">
                  {t('contact.form.fullName')}
                </label>

                <input
                  type="text"
                  placeholder={t('contact.form.namePlaceholder')}
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Email */}

              <div>
                <label className="text-sm text-slate-300">
                  {t('contact.form.email')}
                </label>

                <input
                  type="email"
                  placeholder={t('contact.form.emailPlaceholder')}
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subject */}

              <div>
                <label className="text-sm text-slate-300">
                  {t('contact.form.subject')}
                </label>

                <input
                  type="text"
                  placeholder={t('contact.form.subjectPlaceholder')}
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Message */}

              <div>
                <label className="text-sm text-slate-300">
                  {t('contact.form.message')}
                </label>

                <textarea
                  rows="5"
                  placeholder={t('contact.form.messagePlaceholder')}
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              {/* Button */}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:scale-[1.02] transition duration-300 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20"
              >
                {t('contact.form.submit')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
