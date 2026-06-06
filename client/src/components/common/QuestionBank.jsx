import React, { useState } from "react";
import { Search, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const mockData = [
  {
    class: "Class 9",
    subjects: [
      {
        name: "Mathematics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Science",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    class: "Class 10",
    subjects: [
      {
        name: "Mathematics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Science",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "English",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    class: "Class 11",
    subjects: [
      {
        name: "Physics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Chemistry",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Mathematics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    class: "Class 12",
    subjects: [
      {
        name: "Physics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Chemistry",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Mathematics",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: "Biology",
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
];

const QuestionBank = () => {
  const [selectedClass, setSelectedClass] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = mockData.filter((item) => {
    const classMatch = selectedClass === "All" || item.class === selectedClass;

    const subjectMatch = item.subjects.some((subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return classMatch && (searchTerm ? subjectMatch : true);
  });

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handlePaperAccess = (year, subject, action) => {
    if (!user) {
      navigate("/login", {
        state: { from: "/question-bank" },
      });
      return;
    }

    // Later you can open/download the actual PDF here
    console.log(`${action}: ${subject} ${year}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 md:px-12 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">
            Previous Year Question Bank
          </h1>
          <p className="text-slate-400">
            Access previous 5 years question papers by class and subject.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
          >
            <option>All</option>
            <option>Class 9</option>
            <option>Class 10</option>
            <option>Class 11</option>
            <option>Class 12</option>
          </select>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {filteredData.map((classData) => (
            <div key={classData.class}>
              <h2 className="text-2xl font-semibold mb-5">{classData.class}</h2>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classData.subjects
                  .filter((subject) =>
                    subject.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                  )
                  .map((subject) => (
                    <div
                      key={subject.name}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <FileText className="text-cyan-400" size={22} />
                        <h3 className="font-semibold text-lg">
                          {subject.name}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {subject.papers.map((year) => (
                          <div
                            key={year}
                            className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"
                          >
                            <span>{year} Question Paper</span>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handlePaperAccess(year, subject.name, "view")
                                }
                                className="px-3 py-1 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 transition"
                              >
                                View
                              </button>

                              <button
                                onClick={() =>
                                  handlePaperAccess(
                                    year,
                                    subject.name,
                                    "download",
                                  )
                                }
                                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;
