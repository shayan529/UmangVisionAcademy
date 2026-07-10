import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../config/api';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Message sent successfully!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(res.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                  {t('contact.supportCards.business.title')}
                </h3>

                <p className="text-slate-400 mt-3">
                  {t('contact.supportCards.business.detail')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-2xl">
            <h2 className="text-3xl font-bold">{t('contact.form.title')}</h2>

            <p className="text-slate-400 mt-3">{t('contact.form.subtitle')}</p>

            <form className="space-y-6 mt-10" onSubmit={handleSubmit}>
              {/* Name */}

              <div>
                <label className="text-sm text-slate-300">
                  {t('contact.form.fullName')}
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
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
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder={t('contact.form.messagePlaceholder')}
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              {/* Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:scale-[1.02] transition duration-300 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  t('contact.form.submit')
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
