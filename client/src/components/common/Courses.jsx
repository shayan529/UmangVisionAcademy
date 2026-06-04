import { useState, useMemo } from "react";
import CourseCard from "./CourseCard";

const mockCourses = [
  {
    _id: "1",
    subject: "Mathematics",
    className: "Class 10",
    title: "Mathematics - Class 10",
    description: "Complete CBSE Mathematics curriculum.",
    instructor: { name: "Rahul Sharma" },
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    rating: 4.8,
    reviews: 124,
    students: 560,
    price: 499,
  },
  {
    _id: "2",
    subject: "Science",
    className: "Class 8",
    title: "Science - Class 8",
    description: "Physics, Chemistry and Biology basics.",
    instructor: { name: "Priya Singh" },
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
    rating: 4.7,
    reviews: 92,
    students: 420,
    price: 200,
  },
  {
    _id: "3",
    subject: "Physics",
    className: "Class 11",
    title: "Physics - Class 11",
    description: "Mechanics, Motion and Laws of Physics.",
    instructor: { name: "Amit Verma" },
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
    rating: 4.9,
    reviews: 210,
    students: 840,
    price: 150,
  },
  {
    _id: "4",
    subject: "Chemistry",
    className: "Class 12",
    title: "Chemistry - Class 12",
    description: "Organic, Inorganic and Physical Chemistry.",
    instructor: { name: "Neha Gupta" },
    thumbnail: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6",
    rating: 4.6,
    reviews: 88,
    students: 390,
    price: 600,
  },
];

// Derived filter options — computed once, not on every render
const dynamicClasses = ["All", ...new Set(mockCourses.map((c) => c.className))];
const dynamicSubjects = [
  "All Subjects",
  ...new Set(mockCourses.map((c) => c.subject)),
];

const Courses = () => {
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");

  // Filter only recomputes when the two selectors change — not on every render
  const filteredCourses = useMemo(
    () =>
      mockCourses.filter((course) => {
        const classMatch =
          selectedClass === "All" || course.className === selectedClass;
        const subjectMatch =
          selectedSubject === "All Subjects" ||
          course.subject === selectedSubject;
        return classMatch && subjectMatch;
      }),
    [selectedClass, selectedSubject],
  );

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
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              {dynamicClasses.map((cls) => (
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
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
            >
              {dynamicSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={{
                title: course.title,
                instructor: course.instructor?.name || "Instructor",
                rating: course.rating ?? 0,
                reviews: course.reviews ?? 0,
                price: `₹${course.price ?? 0}`,
                image: course.thumbnail,
              }}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-3xl font-bold text-white">No Courses Found</h3>
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
