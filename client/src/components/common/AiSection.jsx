const aiFeatures = [
  {
    title: "AI Tutor",
    desc: "Ask questions instantly and receive step-by-step explanations powered by AI.",
    icon: "🤖",
  },

  {
    title: "AI Quiz Generator",
    desc: "Generate smart quizzes, mock tests and practice questions automatically.",
    icon: "📝",
  },

  {
    title: "Voice AI Assistant",
    desc: "Learn using voice conversations and AI-powered speaking assistance.",
    icon: "🎤",
  },

  {
    title: "Personalized Learning",
    desc: "Get AI-powered course recommendations based on your learning progress.",
    icon: "📚",
  },

  {
    title: "AI Notes & Summaries",
    desc: "Automatically generate notes, summaries and key learning points.",
    icon: "📄",
  },

  {
    title: "Progress Analytics",
    desc: "Track learning performance, achievements and skill growth with AI insights.",
    icon: "📊",
  },
]

const AISection = () => {
  return (
    <section className="px-6 md:px-10 py-24 bg-[#0B1120] overflow-hidden relative">

      {/* Background Glow */}

      <div className="absolute top-0 left-0 w-64 h-64 sm:w-100 sm:h-100 bg-indigo-500/20 blur-3xl rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-100 sm:h-100 bg-cyan-500/20 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left Dashboard */}

        <div className="relative">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between mb-8">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  AI Learning Assistant
                </h2>

                <p className="text-slate-400 mt-1">
                  Smart AI Powered Education
                </p>

              </div>

              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm">
                Online
              </div>

            </div>

            {/* AI Tutor Card */}

            <div className="bg-[#111827] rounded-3xl p-6 border border-white/5">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-white">
                    AI Tutor Session
                  </h3>

                  <p className="text-slate-400 mt-2">
                    Personalized coding assistance
                  </p>

                </div>

                <div className="text-indigo-400 font-bold text-lg">
                  92%
                </div>

              </div>

              {/* Progress */}

              <div className="w-full bg-slate-700 h-3 rounded-full mt-6 overflow-hidden">

                <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 w-[92%] rounded-full"></div>

              </div>

            </div>

            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">

              <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">

                <h3 className="text-3xl font-bold text-indigo-400">
                  24/7
                </h3>

                <p className="text-slate-400 mt-2">
                  AI Support
                </p>

              </div>

              <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">

                <h3 className="text-3xl font-bold text-cyan-400">
                  10K+
                </h3>

                <p className="text-slate-400 mt-2">
                  AI Sessions
                </p>

              </div>

            </div>

            {/* Bottom AI Card */}

            <div className="mt-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl p-6 text-white">

              <h3 className="text-2xl font-bold">
                Smart AI Recommendations
              </h3>

              <p className="mt-2 text-white/80">
                AI suggests courses, quizzes and personalized learning paths.
              </p>

            </div>

          </div>

        </div>

        {/* Right Content */}

        <div>

          <p className="text-indigo-400 font-medium mb-4">
            Future Of Education
          </p>

          <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">

            AI Powered Learning

          </h2>

          <p className="text-slate-400 text-lg mt-6 leading-relaxed max-w-2xl">
            Experience modern education with AI tutors, personalized learning,
            voice assistants, smart quizzes and advanced learning analytics
            designed to improve student performance.
          </p>

          {/* Features */}

          <div className="grid sm:grid-cols-2 gap-6 mt-12">

            {aiFeatures.map((feature, index) => (

              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[28px] p-6 hover:-translate-y-2 transition duration-300"
              >

                {/* Icon */}

                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-5">
                  {feature.icon}
                </div>

                {/* Title */}

                <h3 className="text-2xl font-bold text-white">
                  {feature.title}
                </h3>

                {/* Description */}

                <p className="text-slate-400 mt-4 leading-relaxed">
                  {feature.desc}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  )
}

export default AISection