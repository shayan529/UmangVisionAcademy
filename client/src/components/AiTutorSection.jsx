import React from "react"

const AITutorSection = () => {
  return (
    <section
      id="ai-tutor"
      className="mt-16 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[32px] p-8"
    >

      <h2 className="text-3xl font-bold">
        AI Tutor
      </h2>

      <p className="text-white/80 mt-4">
        Ask questions, generate quizzes and get instant explanations.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">

        <div className="bg-black/20 rounded-2xl p-6">

          <h3 className="text-2xl font-bold">
            AI Chat
          </h3>

          <p className="text-white/70 mt-3">
            Chat with AI for coding help and learning assistance.
          </p>

          <button className="mt-6 bg-white text-black px-5 py-3 rounded-2xl font-semibold">
            Start Chat
          </button>

        </div>

        <div className="bg-black/20 rounded-2xl p-6">

          <h3 className="text-2xl font-bold">
            AI Voice Call
          </h3>

          <p className="text-white/70 mt-3">
            Practice speaking and live conversations with AI.
          </p>

          <button className="mt-6 bg-white text-black px-5 py-3 rounded-2xl font-semibold">
            Start Call
          </button>

        </div>

      </div>

    </section>
  )
}

export default AITutorSection