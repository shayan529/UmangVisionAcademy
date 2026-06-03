import { useState } from "react";
import CourseCard from "./CourseCard";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../../redux/slices/courseSlice";

const Courses = () => {
  const dispatch = useDispatch();

  const { courses, loading } = useSelector((state) => state.courses);

  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");

  const dynamicClasses = [
    "All",
    ...new Set(courses.map((course) => course.className).filter(Boolean)),
  ];

  const dynamicSubjects = [
    "All Subjects",
    ...new Set(courses.map((course) => course.subject).filter(Boolean)),
  ];

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const filteredCourses = courses.filter((course) => {
    const classMatch =
      selectedClass === "All" || course.className === selectedClass;

    const subjectMatch =
      selectedSubject === "All Subjects" || course.subject === selectedSubject;

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

        {/* Courses */}
        {loading && (
          <div className="text-center py-10 text-slate-400">
            Loading courses...
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard
              course={{
                title: course.title,
                instructor: course.instructor?.name || "Instructor",
                rating: course.rating || 0,
                reviews: course.reviews || 0,
                price: `₹${course.price || 0}`,
                image: course.thumbnail,
              }}
            />
          ))}
        </div>

        {/* Empty State */}

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
