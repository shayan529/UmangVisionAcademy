import React from "react";
import { Star, Clock, Users, PlayCircle, BookOpen } from "lucide-react";

const CourseDemoTest = () => {
  const course = {
    title: "Complete React Development Bootcamp",
    instructor: "Shayan Khan",
    category: "Web Development",
    level: "Intermediate",
    rating: 4.8,
    students: 1250,
    duration: "18 Hours",
    lessons: 42,
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200",
    description:
      "Master modern React from fundamentals to advanced concepts including Hooks, Context API, Redux Toolkit, Routing, Authentication, and Real-World Projects.",
    learn: [
      "Build modern React applications",
      "Understand Hooks and State Management",
      "Use Redux Toolkit effectively",
      "Create protected routes",
      "Build full-stack projects",
      "Deploy production-ready applications",
    ],
    curriculum: [
      "Introduction to React",
      "JSX and Components",
      "Props and State",
      "React Hooks",
      "React Router",
      "Redux Toolkit",
      "Authentication",
      "Project: LMS Platform",
    ],
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover opacity-25"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172abf] to-transparent" />

        <div className="absolute bottom-10 left-10 max-w-3xl">
          <span className="px-3 py-1 rounded-full bg-purple-600 text-sm">
            {course.category}
          </span>

          <h1 className="text-5xl font-bold mt-4">{course.title}</h1>

          <p className="text-slate-300 mt-4 text-lg">{course.description}</p>

          <div className="flex gap-6 mt-5 text-sm text-slate-300">
            <span>👨‍🏫 {course.instructor}</span>
            <span>📊 {course.level}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl">
              <Star className="mb-2" />
              <p className="text-2xl font-bold">{course.rating}</p>
              <p className="text-slate-400">Rating</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl">
              <Users className="mb-2" />
              <p className="text-2xl font-bold">{course.students}</p>
              <p className="text-slate-400">Students</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl">
              <Clock className="mb-2" />
              <p className="text-2xl font-bold">{course.duration}</p>
              <p className="text-slate-400">Duration</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl">
              <BookOpen className="mb-2" />
              <p className="text-2xl font-bold">{course.lessons}</p>
              <p className="text-slate-400">Lessons</p>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-slate-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">What You'll Learn</h2>

            <div className="grid md:grid-cols-2 gap-3">
              {course.learn.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum */}
          <div className="bg-slate-900 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-5">Course Curriculum</h2>

            <div className="space-y-3">
              {course.curriculum.map((lesson, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-800 rounded-xl"
                >
                  <span>
                    {index + 1}. {lesson}
                  </span>

                  <PlayCircle size={20} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div>
          <div className="bg-slate-900 rounded-2xl p-6 sticky top-6">
            <div className="aspect-video rounded-xl overflow-hidden mb-5">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-4xl font-bold mb-5">Free Demo</div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 font-semibold mb-3">
              Enroll Now
            </button>

            <button className="w-full py-3 rounded-xl border border-slate-700">
              Watch Preview
            </button>

            <div className="mt-6 text-sm text-slate-400 space-y-2">
              <p>✓ Full lifetime access</p>
              <p>✓ Certificate of completion</p>
              <p>✓ Downloadable resources</p>
              <p>✓ Access on mobile & desktop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDemoTest;
