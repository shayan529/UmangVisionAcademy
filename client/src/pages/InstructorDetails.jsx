import React from "react";
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
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn Revenue",
      description:
        "Generate income by selling your courses to thousands of students worldwide.",
    },
    {
      icon: Map,
      title: "Nationwide Presence",
      description:
        "Teach students across India and establish yourself as a trusted educator.",
    },
    {
      icon: Award,
      title: "Instructor Recognition",
      description:
        "Become a verified instructor and grow your reputation in your field.",
    },
    {
      icon: Brain,
      title: "AI Teaching Tools",
      description:
        "Use AI-powered tools to create quizzes, notes and personalized learning.",
    },
  ];

  const features = [
    "Upload video courses and learning materials",
    "Create quizzes and assignments",
    "Host live mentorship sessions",
    "Track student progress analytics",
    "Build your instructor profile",
    "Earn certificates and badges",
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_20%),linear-gradient(135deg,#020817_0%,#111827_50%,#1e1b4b_100%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                <GraduationCap size={16} />
                Become an Instructor
              </div>

              <h1 className="mt-8 text-5xl md:text-6xl font-black leading-tight">
                Share your knowledge
                <span className="block text-emerald-300">
                  and inspire learners
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl">
                Join our growing instructor community and teach students from
                around the world. Create engaging courses, host live classes,
                and earn revenue while building your personal brand.
              </p>

              {/* BUTTONS */}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/become-instructor"
                  className="bg-emerald-300 hover:bg-emerald-400 transition duration-300 px-8 py-4 rounded-full text-slate-950 font-semibold shadow-xl shadow-emerald-300/20 inline-flex items-center justify-center"
                >
                  <button className="inline-flex items-center gap-3 rounded-full bg-emerald-300 px-8 py-4 text-slate-950 font-bold transition hover:scale-[1.02]">
                    Apply as Instructor
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
                    Instructor Dashboard
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">Teach Smarter</h2>
                </div>

                <div className="rounded-full bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  Live
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-5 mt-10">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-bold text-emerald-300">120K+</p>
                  <p className="mt-2 text-slate-400">Active Students</p>
                </div>
              </div>

              {/* FEATURES */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Video className="text-emerald-300" size={22} />
                  <div>
                    <h3 className="font-semibold">Upload Video Lessons</h3>
                    <p className="text-sm text-slate-400">
                      Create engaging high quality video courses
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Users className="text-sky-300" size={22} />
                  <div>
                    <h3 className="font-semibold">Live Mentorship</h3>
                    <p className="text-sm text-slate-400">
                      Conduct live sessions and interact with students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <BookOpen className="text-pink-300" size={22} />
                  <div>
                    <h3 className="font-semibold">Course Analytics</h3>
                    <p className="text-sm text-slate-400">
                      Track enrollments and student performance
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
          <h2 className="text-5xl font-black">Why become an instructor?</h2>

          <p className="mt-5 text-lg text-slate-400 leading-8">
            Empower students while growing your career and income through our
            AI-powered learning platform.
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
                Everything you need
                <span className="block text-emerald-300">to teach online</span>
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Our platform provides all the tools you need to create, manage
                and grow your online teaching business.
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
