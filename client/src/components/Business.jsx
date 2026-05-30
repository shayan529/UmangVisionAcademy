import { Link } from "react-router-dom"
import Navbar from "../Layout/Navbar"

const features = [
  {
    title: "Employee Training",
    desc: "Upskill your teams with AI-powered learning paths and expert-led courses.",
  },

  {
    title: "Analytics Dashboard",
    desc: "Track employee progress, certifications, engagement and learning performance.",
  },

  {
    title: "Live Sessions",
    desc: "Conduct live classes, workshops and mentorship sessions for your teams.",
  },

  {
    title: "AI Tutor Assistant",
    desc: "Employees can instantly ask AI for explanations, summaries and learning help.",
  },

  {
    title: "Custom Learning Paths",
    desc: "Create personalized training journeys for departments and teams.",
  },

  {
    title: "Certificates & Achievements",
    desc: "Reward employees with certificates, badges and skill achievements.",
  },
]

const Business = () => {
  return (
    <div className="min-h-screen bg-[#0B1120]">

      

      {/* Hero Section */}

      <section className="px-6 md:px-10 py-24 overflow-hidden relative">

        {/* Background Glow */}

        <div className="absolute top-0 left-0 w-64 h-64 sm:w-100 sm:h-100 bg-indigo-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-100 sm:h-100 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-2 items-center relative z-10">

          {/* Left Content */}

          <div>

            <p className="text-indigo-400 font-medium mb-5">
              Enterprise Learning Solutions
            </p>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">

              Train Your Team

              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Smarter With AI
              </span>

            </h1>

            <p className="text-slate-400 text-lg md:text-xl mt-8 leading-relaxed max-w-2xl">
              Empower your employees with AI-powered training,
              live mentorship, certifications and personalized
              learning experiences designed for modern businesses.
            </p>

            {/* Buttons */}

            <div className="flex flex-wrap gap-5 mt-10">

                <Link to="/business-demo">
              <button className="bg-indigo-600 cursor-pointer hover:bg-indigo-700 transition duration-300 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-indigo-500/20">
                  Check Demo
              </button>
                </Link>

                <Link to="/contact">
              <button className="border cursor-pointer border-white/10 hover:border-indigo-400 hover:bg-indigo-500/10 transition duration-300 text-white px-8 py-4 rounded-2xl font-semibold">
                  Contact Sales
              </button>
                </Link>

            </div>

            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">

              <div>

                <h2 className="text-4xl font-bold text-white">
                  500+
                </h2>

                <p className="text-slate-400 mt-2">
                  Companies
                </p>

              </div>

              <div>

                <h2 className="text-4xl font-bold text-white">
                  1M+
                </h2>

                <p className="text-slate-400 mt-2">
                  Employees Trained
                </p>

              </div>

              <div>

                <h2 className="text-4xl font-bold text-white">
                  98%
                </h2>

                <p className="text-slate-400 mt-2">
                  Satisfaction
                </p>

              </div>

            </div>

          </div>

          {/* Right Dashboard */}

          <div className="relative">

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 shadow-2xl">

              {/* Header */}

              <div className="flex items-center justify-between mb-8">

                <div>

                  <h2 className="text-2xl font-bold text-white">
                    Business Dashboard
                  </h2>

                  <p className="text-slate-400 mt-1">
                    Team Learning Analytics
                  </p>

                </div>

                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm">
                  Active
                </div>

              </div>

              {/* Team Progress */}

              <div className="bg-[#111827] rounded-3xl p-6 border border-white/5">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-xl font-bold text-white">
                      Team Progress
                    </h3>

                    <p className="text-slate-400 mt-2">
                      AI Development Training
                    </p>

                  </div>

                  <div className="text-indigo-400 font-bold text-lg">
                    76%
                  </div>

                </div>

                <div className="w-full bg-slate-700 h-3 rounded-full mt-6 overflow-hidden">

                  <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 w-[76%] rounded-full"></div>

                </div>

              </div>

              {/* Small Cards */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">

                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">

                  <h3 className="text-3xl font-bold text-indigo-400">
                    250+
                  </h3>

                  <p className="text-slate-400 mt-2">
                    Employees
                  </p>

                </div>

                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">

                  <h3 className="text-3xl font-bold text-cyan-400">
                    120
                  </h3>

                  <p className="text-slate-400 mt-2">
                    Certificates
                  </p>

                </div>

              </div>

              {/* AI Box */}

              <div className="mt-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl p-6 text-white">

                <h3 className="text-2xl font-bold">
                  AI Learning Assistant
                </h3>

                <p className="mt-2 text-white/80">
                  AI-powered mentoring and personalized business training.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Features */}

      <section className="px-6 md:px-10 pb-24">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <p className="text-indigo-400 font-medium mb-3">
              Powerful Features
            </p>

            <h2 className="text-5xl font-bold text-white">
              Everything Your Team Needs
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {features.map((feature, index) => (

              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-[28px] p-8 backdrop-blur-xl hover:-translate-y-2 transition duration-300"
              >

                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-6">
                  🚀
                </div>

                <h3 className="text-2xl font-bold text-white">
                  {feature.title}
                </h3>

                <p className="text-slate-400 mt-4 leading-relaxed">
                  {feature.desc}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

    </div>
  )
}

export default Business