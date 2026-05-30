import React from "react"
import { Link } from "react-router-dom"

const steps = [
  {
    title: "Apply",
    description: "Submit your bio, expertise and sample content so we can learn about your teaching style.",
  },
  {
    title: "Start Uploading",
    description: "Start creating your first course and content, and get feedback from Students.",
  },
  {
    title: "Start Teaching",
    description: "Launch your first course, reach students, and start your journey as an instructor.",
  },
]


const BecomeInstructor = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide">
              Teach on SkillSphere
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Share Your
              <span className="ml-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Knowledge.
              </span>
            </h1>

            <p className="max-w-2xl text-slate-400 text-lg leading-8">
              Join 300+ instructors building courses that reach thousands of learners. Submit your application, get verified fast, and start teaching with AI-supported tools.
            </p>


          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/10 flex flex-col justify-between">
            <div className="space-y-4 mb-6">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Apply now</p>
              <h2 className="text-3xl font-bold text-white">Start your instructor journey</h2>
              <p className="text-slate-400 leading-7">
                Fill in your expertise and sample content to get started. Our team will reach out within 24 hours with next steps.
              </p>
            </div>
            <Link
              to="/become-instructor/apply"
              className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 w-full text-center"
            >
              Become an Instructor
            </Link>
          </div>
        </div>

        <section className="mt-16 grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-lg shadow-indigo-500/5">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">How it works</p>
              <h2 className="mt-4 text-3xl font-bold text-white">A simple process to launch your first course</h2>
              <p className="mt-4 text-slate-400 leading-7">
                Apply with your expertise, get verified quickly, and publish your first course to start earning from day one.
              </p>

              <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <div key={step.title} className="flex gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300 text-lg font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-slate-400 leading-6">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10 flex flex-col justify-center items-center text-center">
            <div className="space-y-6 max-w-md my-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Ready to join?</p>
              <h2 className="text-3xl font-bold text-white">Apply to teach</h2>
              <p className="text-slate-400 leading-7">
                Are you ready to share your expertise and shape the future of learning? Submit your application and become part of our world-class coaching community.
              </p>
              <div className="pt-6">
                <Link
                  to="/become-instructor/apply"
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                >
                  Become an Instructor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default BecomeInstructor