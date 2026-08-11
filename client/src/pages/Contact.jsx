import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  MapPin,
  Clock,
  Building2,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  User,
  Tag,
  ArrowRight,
  Headphones,
} from "lucide-react";
import api from "../config/api";
import SEO from "../components/common/SEO";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "General Query",
  });
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const categories = [
    { label: "General Query", icon: "💬" },
    { label: "Course & Billing", icon: "💳" },
    { label: "Instructor Onboarding", icon: "🎓" },
    { label: "Business / Enterprise", icon: "🏢" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("umangvisionacademy@gmail.com");
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/contact", {
        ...formData,
        subject: `[${formData.category}] ${formData.subject}`,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Message sent successfully! We'll reply shortly.");
        setFormData({ name: "", email: "", subject: "", message: "", category: "General Query" });
      } else {
        toast.error(res.data?.message || "Failed to send message");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white relative overflow-hidden font-sans">
      <SEO
        title="Contact Us"
        description="Get in touch with Umang Vision Academy for support, subscriptions, instructor onboarding, and enterprise solutions."
      />

      {/* ── Ambient Glow Backgrounds ── */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />

      <main className="relative max-w-7xl mx-auto px-5 md:px-10 py-12 lg:py-20">
        {/* ── Top Header Badge & Intro ── */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-semibold text-indigo-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles size={14} className="text-amber-400" />
            <span>{t("contact.tag", "CONTACT US")}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">24/7 Support Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            {t("contact.headline", "Let's build the future of")}{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {t("contact.highlight", "AI Learning")}
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t(
              "contact.description",
              "Have questions, feedback, or business inquiries? Reach out to our dedicated team for courses, subscriptions, instructor onboarding, and enterprise solutions.",
            )}
          </p>
        </div>

        {/* ── Main Layout: Contact Details Left + Form Right ── */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* ── LEFT COLUMN: Support Cards & Channels (5 cols) ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Email Support */}
            <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {t("contact.supportCards.email.title", "Email Support")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock size={12} className="text-emerald-400" />
                      <span>Response within 24 hours</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Copy Email Address"
                >
                  {copiedEmail ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <a
                  href="mailto:umangvisionacademy@gmail.com"
                  className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 truncate underline underline-offset-4"
                >
                  umangvisionacademy@gmail.com
                </a>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>

            {/* Card 2: Business & Institutional Partnerships */}
            <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl hover:bg-white/[0.06] hover:border-purple-500/30 transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {t("contact.supportCards.business.title", "Business & Institutional")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schools, enterprise bulk seats & partners
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Looking to onboard your school, coaching center, or corporate team onto Umang Vision Academy? Contact our enterprise team.
              </p>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <a
                  href="mailto:umangvisionacademy@gmail.com?subject=Enterprise%20Inquiry"
                  className="inline-flex items-center gap-2 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <span>Enterprise Inquiry</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Card 3: Location & Academy HQ */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Academy Head Office</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Gujarat, India</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Umang Vision Academy — Empowering students nationwide with AI-driven smart learning and certified mentorship.
              </p>
            </div>

            {/* Help & FAQ Quick Prompt */}
            <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 p-5 backdrop-blur-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Looking for instant answers?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Browse FAQs or chat with AI Tutor</p>
                </div>
              </div>
              <Link
                to="/faq"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-indigo-600/20"
              >
                View FAQ
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Glassmorphic Interactive Form (7 cols) ── */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/90 via-[#0a1224]/90 to-slate-950/90 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_0_50px_rgba(99,102,241,0.12)]">
              {/* Subtle top accent line */}
              <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

              <div className="space-y-2 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <MessageSquare className="text-indigo-400" size={24} />
                    {t("contact.form.title", "Send A Message")}
                  </h2>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Encrypted
                  </span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {t("contact.form.subtitle", "We usually respond within 24 hours.")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Topic Selection Pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Select Topic
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        type="button"
                        key={cat.label}
                        onClick={() => setFormData({ ...formData, category: cat.label })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          formData.category === cat.label
                            ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email Row */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      {t("contact.form.fullName", "Full Name")} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t("contact.form.namePlaceholder", "Enter your name")}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      {t("contact.form.email", "Email Address")} <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t("contact.form.emailPlaceholder", "Enter your email")}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    {t("contact.form.subject", "Subject")} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder={t("contact.form.subjectPlaceholder", "Enter subject")}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    {t("contact.form.message", "Message")} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows="5"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder={t("contact.form.messagePlaceholder", "Write your message...")}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Message…</span>
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      <span>{t("contact.form.submit", "Send Message")}</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-500">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
