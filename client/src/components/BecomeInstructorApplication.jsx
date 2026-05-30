import React from "react"
import { Link } from "react-router-dom"

const BecomeInstructorApplication = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <Link
          to="/become-instructor"
          className="inline-flex items-center gap-2 mr-4 text-indigo-400 hover:text-indigo-300 transition mb-8 text-sm font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to overview
        </Link>

        <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide mb-4">
          Application Form
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Become an
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 ml-2">
            Instructor
          </span>
        </h2>
        <p className="text-slate-400 text-lg leading-7 max-w-xl">
          Tell us about your teaching experience, your expertise, and share a sample content link so we can approve your profile quickly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10">
          <form className="space-y-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Your full name</span>
              <input
                type="text"
                placeholder="John Doe"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Area of expertise</span>
              <input
                type="text"
                placeholder="AI / Web Development / Design"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Brief bio</span>
              <textarea
                rows="4"
                placeholder="Share your teaching experience and what makes your classes unique."
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Sample content link (YouTube / Google Drive)</span>
              <input
                type="url"
                placeholder="https://"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20"
              >
                <Link to="/instructor-dashboard" className="block w-full">
                  Submit Application
                </Link>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BecomeInstructorApplication
