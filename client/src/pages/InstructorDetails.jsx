import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "../components/common/SEO";
import {
  GraduationCap,
  Users,
  DollarSign,
  Globe,
  Award,
  Video,
  BookOpen,
  Brain,
  CheckCircle,
  ArrowRight,
  Map,
} from "lucide-react";
import { Link } from "react-router-dom";

const InstructorDetails = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: DollarSign,
      title: t("instructorDetails.benefits.earnRevenue.title"),
      description: t("instructorDetails.benefits.earnRevenue.description"),
    },
    {
      icon: Map,
      title: t("instructorDetails.benefits.nationwidePresence.title"),
      description: t(
        "instructorDetails.benefits.nationwidePresence.description",
      ),
    },
    {
      icon: Award,
      title: t("instructorDetails.benefits.instructorRecognition.title"),
      description: t(
        "instructorDetails.benefits.instructorRecognition.description",
      ),
    },
    {
      icon: Brain,
      title: t("instructorDetails.benefits.aiTeachingTools.title"),
      description: t("instructorDetails.benefits.aiTeachingTools.description"),
    },
  ];

  const rawFeatures = t("instructorDetails.featuresSection.items", {
    returnObjects: true,
  });
  const features = Array.isArray(rawFeatures) ? rawFeatures : [];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <SEO title="Instructor Details" description="Learn more about our expert instructors at Umang Vision Academy." />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_20%),linear-gradient(135deg,#020817_0%,#111827_50%,#1e1b4b_100%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                <GraduationCap size={16} />
                {t("instructorDetails.tag")}
              </div>

              <h1 className="mt-8 text-5xl md:text-6xl font-black leading-tight">
                {t("instructorDetails.heroTitleLine1")}
                <span className="block text-emerald-300">
                  {t("instructorDetails.heroTitleLine2")}
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl">
                {t("instructorDetails.heroDescription")}
              </p>

              {/* BUTTONS */}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/become-instructor"
                  className="bg-emerald-300 hover:bg-emerald-400 transition duration-300 px-8 py-4 rounded-full text-slate-950 font-semibold shadow-xl shadow-emerald-300/20 inline-flex items-center justify-center"
                >
                  <button className="inline-flex items-center gap-3 rounded-full bg-emerald-300 px-8 py-4 text-slate-950 font-bold transition hover:scale-[1.02]">
                    {t("instructorDetails.applyAsInstructor")}
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-[40px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    {t("instructorDetails.dashboardLabel")}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">
                    {t("instructorDetails.teachSmarter")}
                  </h2>
                </div>

                <div className="rounded-full bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  {t("instructorDetails.live")}
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-5 mt-10">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-bold text-emerald-300">120K+</p>
                  <p className="mt-2 text-slate-400">
                    {t("instructorDetails.activeStudents")}
                  </p>
                </div>
              </div>

              {/* FEATURES */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Video className="text-emerald-300" size={22} />
                  <div>
                    <h3 className="font-semibold">
                      {t("instructorDetails.uploadVideoLessons")}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {t("instructorDetails.uploadVideoLessonsDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Users className="text-sky-300" size={22} />
                  <div>
                    <h3 className="font-semibold">
                      {t("instructorDetails.liveMentorship")}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {t("instructorDetails.liveMentorshipDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <BookOpen className="text-pink-300" size={22} />
                  <div>
                    <h3 className="font-semibold">
                      {t("instructorDetails.courseAnalytics")}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {t("instructorDetails.courseAnalyticsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-black">
            {t("instructorDetails.benefits.heading")}
          </h2>

          <p className="mt-5 text-lg text-slate-400 leading-8">
            {t("instructorDetails.benefits.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 mt-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={index}
                className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-2 hover:border-emerald-300/30"
              >
                <div className="inline-flex rounded-2xl bg-emerald-300/10 p-4">
                  <Icon className="text-emerald-300" size={28} />
                </div>

                <h3 className="mt-6 text-2xl font-bold">{benefit.title}</h3>

                <p className="mt-4 leading-7 text-slate-400">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div>
              <h2 className="text-5xl font-black leading-tight">
                {t("instructorDetails.featuresSection.headingLine1")}
                <span className="block text-emerald-300">
                  {t("instructorDetails.featuresSection.headingLine2")}
                </span>
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                {t("instructorDetails.featuresSection.subtitle")}
              </p>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <CheckCircle className="text-emerald-300" size={24} />

                  <p className="text-lg text-slate-200">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InstructorDetails;
