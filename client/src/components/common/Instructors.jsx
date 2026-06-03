import { Link } from "react-router-dom";
import InstructorDashboard from "../instructor/InstructorDashboard";

const benefits = [
  {
    title: "Build Your Community",
    desc: "Create private subscriber communities and engage with students.",
    icon: "🌍",
  },

  {
    title: "AI Teaching Tools",
    desc: "Use AI tools for quizzes, summaries, captions and student support.",
    icon: "🤖",
  },

  {
    title: "Live Classes",
    desc: "Host live mentorship sessions, webinars and interactive workshops.",
    icon: "🎥",
  },

  {
    title: "Analytics Dashboard",
    desc: "Track course sales, student engagement and performance analytics.",
    icon: "📊",
  },

  {
    title: "Certificates",
    desc: "Provide certificates and achievements to your students.",
    icon: "🏆",
  },
];

const Instructor = () => {
  return (
    <div className="bg-[#0B1120] text-white min-h-screen">
      {/* Hero Section */}

      <section className="px-6 md:px-10 py-24 relative overflow-hidden">
        {/* Background Glow */}

        <div className="absolute top-0 left-0 w-64 h-64 sm:w-100 sm:h-100 bg-indigo-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-100 sm:h-100 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-2 items-center relative z-10">
          {/* Left Content */}

          <div>
            <p className="text-indigo-400 font-medium mb-5">
              Teach & Inspire Millions
            </p>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Become An
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Instructor
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl mt-8 leading-relaxed">
              Share your expertise, build your community, host live sessions and
              use AI tools to create engaging courses. Join us and inspire
              millions of students worldwide.
            </p>

            {/* Buttons */}

            <div className="flex flex-wrap gap-5 mt-10">
              <Link
                to="/become-instructor"
                className="bg-indigo-600 hover:bg-indigo-700 transition duration-300 px-8 py-4 rounded-2xl text-white font-semibold shadow-xl shadow-indigo-500/20 inline-flex items-center justify-center"
              >
                Start Teaching
              </Link>

              <Link to="/instructor-details">
                <button className="border cursor-pointer border-white/10 hover:border-indigo-400 hover:bg-indigo-500/10 transition duration-300 px-8 py-4 rounded-2xl text-white font-semibold">
                  Learn More
                </button>
              </Link>
            </div>

            {/* Stats */}

            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
              <div>
                <h2 className="text-4xl font-bold">50K+</h2>

                <p className="text-slate-400 mt-2">Instructors</p>
              </div>

              <div>
                <h2 className="text-4xl font-bold">$12M+</h2>

                <p className="text-slate-400 mt-2">Revenue Paid</p>
              </div>

              <div>
                <h2 className="text-4xl font-bold">1M+</h2>

                <p className="text-slate-400 mt-2">Students</p>
              </div>
            </div> */}
          </div>

          {/* Right Dashboard */}

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 shadow-2xl">
              {/* Header */}

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Instructor Dashboard</h2>

                  <p className="text-slate-400 mt-1">Course Analytics</p>
                </div>

                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm">
                  Active
                </div>
              </div>

              {/* Revenue Card */}

              {/* <div className="bg-[#111827] rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Monthly Revenue</h3>

                    <p className="text-slate-400 mt-2">
                      AI Web Development Course
                    </p>
                  </div>

                  <div className="text-indigo-400 font-bold text-lg">
                    $8,420
                  </div>
                </div>

                <div className="w-full bg-slate-700 h-3 rounded-full mt-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 w-[82%] rounded-full"></div>
                </div>
              </div> */}

              {/* Stats */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-indigo-400">12K+</h3>

                  <p className="text-slate-400 mt-2">Students</p>
                </div>

                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-cyan-400">4.9</h3>

                  <p className="text-slate-400 mt-2">Instructor Rating</p>
                </div>
              </div>

              {/* AI Tools */}

              <div className="mt-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl p-6">
                <h3 className="text-2xl font-bold">AI Teaching Assistant</h3>

                <p className="mt-2 text-white/80">
                  AI-generated quizzes, subtitles and course summaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 font-medium mb-3">
              Why Teach With Us?
            </p>

            <h2 className="text-5xl font-bold">Instructor Benefits</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[28px] p-8 hover:-translate-y-2 transition duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-6">
                  {benefit.icon}
                </div>

                <h3 className="text-2xl font-bold">{benefit.title}</h3>

                <p className="text-slate-400 mt-4 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Instructor;
