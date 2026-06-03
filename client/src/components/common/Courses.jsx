import { useState } from "react";
import CourseCard from "./CourseCard";
import { Link } from "react-router-dom";

const classes = [
  "All",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const subjects = [
  "All Subjects",
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
];

const sample = [
  {
    title: "Class 5 Mathematics",
    instructor: "Sarah Johnson",
    rating: "4.8",
    reviews: 324,
    price: "₹999",
    class: "Class 5",
    subject: "Mathematics",
    image:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 5 Science",
    instructor: "Emma Watson",
    rating: "4.7",
    reviews: 210,
    price: "₹999",
    class: "Class 5",
    subject: "Science",
    image:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 5 English",
    instructor: "David Miller",
    rating: "4.6",
    reviews: 180,
    price: "₹899",
    class: "Class 5",
    subject: "English",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 10 Mathematics",
    instructor: "Alex Lee",
    rating: "4.9",
    reviews: 540,
    price: "₹1499",
    class: "Class 10",
    subject: "Mathematics",
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 10 Science",
    instructor: "Rahul Verma",
    rating: "4.8",
    reviews: 468,
    price: "₹1499",
    class: "Class 10",
    subject: "Science",
    image:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 10 English",
    instructor: "Priya Sharma",
    rating: "4.7",
    reviews: 250,
    price: "₹1199",
    class: "Class 10",
    subject: "English",
    image:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop",
  },

  {
    title: "Class 10 Social Studies",
    instructor: "Ananya Patel",
    rating: "4.6",
    reviews: 200,
    price: "₹1199",
    class: "Class 10",
    subject: "Social Studies",
    image:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=1200&auto=format&fit=crop",
  },
];

const Courses = () => {
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] =
    useState("All Subjects");

  const filteredCourses = sample.filter((course) => {
    const classMatch =
      selectedClass === "All" ||
      course.class === selectedClass;

    const subjectMatch =
      selectedSubject === "All Subjects" ||
      course.subject === selectedSubject;

    return classMatch && subjectMatch;
  });

  return (
    <section className="px-6 md:px-10 py-20 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>
            <p className="text-indigo-400 font-medium mb-2">
              Explore Learning By Class
            </p>

            <h2 className="text-4xl md:text-5xl font-bold text-white">
             Courses
            </h2>
          </div>

        
        </div>

        {/* Filters */}

        <div className="grid md:grid-cols-2 gap-6 mb-12">

          <div>
            <label className="block text-white font-semibold mb-3">
              Select Class
            </label>

            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">
              Select Subject
            </label>

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(e.target.value)
              }
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Courses */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {filteredCourses.map((course, index) => (

            <div key={index} className="space-y-4">

              <div className="inline-flex px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-sm font-medium">
                {course.class} • {course.subject}
              </div>

              <CourseCard course={course} />

            </div>

          ))}

        </div>

        {/* Empty State */}

        {filteredCourses.length === 0 && (

          <div className="text-center py-20">

            <h3 className="text-3xl font-bold text-white">
              No Courses Found
            </h3>

            <p className="text-slate-400 mt-4">
              Try selecting another class or subject.
            </p>

          </div>

        )}

      </div>
    </section>
  );
};

export default Courses;