import React, { useState } from 'react';
import { Search, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const mockData = [
  {
    board: 'MP Board',
    class: 'Class 9',
    subjects: [
      {
        name: 'Mathematics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Science',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    board: 'CBSE',
    class: 'Class 10',
    subjects: [
      {
        name: 'Mathematics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Science',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'English',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    board: 'ICSE',
    class: 'Class 11',
    subjects: [
      {
        name: 'Physics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Chemistry',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Mathematics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
  {
    board: 'MP Board',
    class: 'Class 12',
    subjects: [
      {
        name: 'Physics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Chemistry',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Mathematics',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
      {
        name: 'Biology',
        papers: [2025, 2024, 2023, 2022, 2021],
      },
    ],
  },
];

const QuestionBank = () => {
  const { t } = useTranslation();
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = mockData.filter((item) => {
    const boardMatch = selectedBoard === 'All' || item.board === selectedBoard;
    const classMatch = selectedClass === 'All' || item.class === selectedClass;

    const subjectMatch = item.subjects.some((subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return boardMatch && classMatch && (searchTerm ? subjectMatch : true);
  });

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handlePaperAccess = (year, subject, action) => {
    if (!user) {
      navigate('/login', {
        state: { from: '/question-bank' },
      });
      return;
    }

    // Later you can open/download the actual PDF here
    console.log(`${action}: ${subject} ${year}`);
  };

  const boardOptions = [
    { value: 'All', label: t('questionBank.boardOptions.all') },
    { value: 'MP Board', label: t('questionBank.boardOptions.mpBoard') },
    { value: 'CBSE', label: t('questionBank.boardOptions.cbse') },
    { value: 'ICSE', label: t('questionBank.boardOptions.icse') },
  ];

  const classOptions = [
    { value: 'All', label: t('questionBank.classOptions.all') },
    { value: 'Class 9', label: t('questionBank.classOptions.class9') },
    { value: 'Class 10', label: t('questionBank.classOptions.class10') },
    { value: 'Class 11', label: t('questionBank.classOptions.class11') },
    { value: 'Class 12', label: t('questionBank.classOptions.class12') },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 md:px-12 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">{t('questionBank.title')}</h1>
          <p className="text-slate-400">{t('questionBank.description')}</p>
        </div>

        {/* Filters */}
        <div className="grid gap-4 mb-10 md:grid-cols-[minmax(0,1fr)_230px_230px]">
          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t('questionBank.subjectLabel')}
            </label>
            <div className="relative w-full">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder={t('questionBank.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t('questionBank.boardLabel')}
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              {boardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-sm text-slate-400">
              {t('questionBank.classLabel')}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {filteredData.map((classData) => (
            <div key={`${classData.board}-${classData.class}`}>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">{classData.class}</h2>
                <span className="rounded-full bg-cyan-600/15 text-cyan-200 px-3 py-1 text-sm">
                  {classData.board}
                </span>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classData.subjects
                  .filter((subject) =>
                    subject.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
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
                            <span>
                              {year} {t('questionBank.questionPaper')}
                            </span>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handlePaperAccess(year, subject.name, 'view')
                                }
                                className="px-3 py-1 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-500 transition"
                              >
                                {t('questionBank.view')}
                              </button>

                              {/* <button
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
                              </button> */}
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
