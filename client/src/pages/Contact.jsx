import React from "react"

const Contact = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">


      {/* Hero Section */}

      <section className="px-6 md:px-10 py-20">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

          {/* Left Content */}

          <div>

            <p className="text-indigo-400 font-semibold mb-4">
              CONTACT US
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Let’s Build The Future Of{" "}
              <span className="text-indigo-400">
                AI Learning
              </span>
            </h1>

            <p className="text-slate-400 mt-8 text-lg leading-relaxed">
              Have questions, feedback, or business inquiries?
              Reach out to our team and we’ll help you with
              courses, subscriptions, instructor onboarding,
              technical support, and enterprise solutions.
            </p>

            {/* Contact Cards */}

            <div className="grid sm:grid-cols-2 gap-5 mt-10">

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">

                <h3 className="text-xl font-semibold">
                  📧 Email Support
                </h3>

                <p className="text-slate-400 mt-3">
                  support@skillsphere.com
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">

                <h3 className="text-xl font-semibold">
                  📞 Phone Support
                </h3>

                <p className="text-slate-400 mt-3">
                  +91 98765 43210
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">

                <h3 className="text-xl font-semibold">
                  🏢 Business Inquiries
                </h3>

                <p className="text-slate-400 mt-3">
                  business@skillsphere.com
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">

                <h3 className="text-xl font-semibold">
                  ⏰ Working Hours
                </h3>

                <p className="text-slate-400 mt-3">
                  Mon - Sat / 9AM - 7PM
                </p>

              </div>

            </div>

          </div>

          {/* Contact Form */}

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-2xl">

            <h2 className="text-3xl font-bold">
              Send A Message
            </h2>

            <p className="text-slate-400 mt-3">
              We usually respond within 24 hours.
            </p>

            <form className="space-y-6 mt-10">

              {/* Name */}

              <div>

                <label className="text-sm text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />

              </div>

              {/* Email */}

              <div>

                <label className="text-sm text-slate-300">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />

              </div>

              {/* Subject */}

              <div>

                <label className="text-sm text-slate-300">
                  Subject
                </label>

                <input
                  type="text"
                  placeholder="Enter subject"
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500"
                />

              </div>

              {/* Message */}

              <div>

                <label className="text-sm text-slate-300">
                  Message
                </label>

                <textarea
                  rows="5"
                  placeholder="Write your message..."
                  className="w-full mt-2 bg-[#111827] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 resize-none"
                ></textarea>

              </div>

              {/* Button */}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-400 to-indigo-600 hover:scale-[1.02] transition duration-300 py-4 rounded-2xl text-black font-semibold shadow-lg shadow-indigo-500/20"
              >
                Send Message
              </button>

            </form>

          </div>

        </div>

      </section>

    </div>
  )
}

export default Contact