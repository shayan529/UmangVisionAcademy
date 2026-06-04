import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden min-h-screen text-white">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.25),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_25%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_40%,#6d28d9_100%)]" />

      {/* CONTENT */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex flex-col xl:flex-row items-start justify-between gap-14">
          {/* LEFT SIDE */}
          <div className="flex-1 space-y-8 max-w-4xl">
            {/* TAG */}
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm shadow-lg shadow-slate-950/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              AI Powered Online Learning
            </div>

            {/* HEADING */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-tight">
                Empowering Students
                <span className="block text-emerald-300">
                  From Class 1 to 12
                </span>
              </h1>

              <p className="max-w-2xl text-slate-200 text-lg md:text-md leading-8">
                Welcome to SkillSphere, your complete AI-powered learning
                platform designed for students from Classes 1 to 12. Learn with
                expert instructors, interactive courses, AI tutors, live
                classes, quizzes, assignments, and personalized learning paths
                that help every student achieve academic excellence.
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/my-courses" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-300 px-8 py-4 text-slate-950 font-semibold shadow-2xl shadow-emerald-300/25 transition duration-300 hover:scale-[1.02] hover:bg-emerald-200">
                  Start Learning
                </button>
              </Link>

              <Link to="/courses" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-white font-semibold backdrop-blur-sm transition duration-300 hover:border-emerald-300 hover:text-emerald-300">
                  Explore Courses
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE STATS */}
          <div className="grid w-full xl:w-[300px] gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">200K+</p>
              <p className="mt-1 text-sm text-slate-400">Students Worldwide</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">10K+</p>
              <p className="mt-1 text-sm text-slate-400">Online Courses</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold">500+</p>
              <p className="mt-1 text-sm text-slate-400">Expert Instructors</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
