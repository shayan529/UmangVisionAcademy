/**
 * courseAiDetails.js
 * Intelligent synthesis of course learning outcomes (What you'll learn),
 * prerequisites (Requirements), and comprehensive formatted descriptions.
 */

export function generateCourseAiDetails(course) {
  if (!course) {
    return {
      whatYouWillLearn: [
        "Master core principles and fundamental concepts with comprehensive video lessons.",
        "Step-by-step problem solving methods for board and competitive exams.",
        "Complete coverage of syllabus topics, previous year questions and test patterns.",
        "Downloadable study notes, chapter summaries, and revision guides.",
        "Build strong conceptual clarity to achieve top percentile marks.",
        "Direct continuous doubt clearing with AI Tutor and faculty members.",
      ],
      requirements: [
        "Basic foundational knowledge of prior class concepts.",
        "A smartphone, tablet, or laptop with stable internet connection.",
        "Notebook and stationery for practice exercises and notes.",
      ],
      description:
        "Comprehensive curriculum designed to help students master all key topics with crystal clarity, expert problem-solving strategies, and continuous educator guidance.",
      instructorName: "Lead Faculty",
      instructorBio: "Expert educator at Umang Vision Academy.",
    };
  }

  const title = course.title || "Comprehensive Course";
  const subject = course.subject || course.category || "Academic Excellence";
  const board = course.board || "CBSE / ICSE / State Board";
  const category = course.category || "Class Curriculum";
  const lessons = course.lessons || [];
  const lessonTitles = lessons.slice(0, 5).map((l) => l.title).filter(Boolean);

  // 1. What You'll Learn (6-8 structured points)
  let whatYouWillLearn = course.whatYouWillLearn;
  if (!Array.isArray(whatYouWillLearn) || whatYouWillLearn.length < 3) {
    whatYouWillLearn = [
      `Master core principles and fundamental concepts of ${subject} aligned with ${board} standards.`,
      `Gain step-by-step problem solving skills and exam-oriented answering techniques for ${category}.`,
      `In-depth conceptual clarity across key modules${lessonTitles.length > 0 ? ` including ${lessonTitles.slice(0, 2).join(" and ")}` : ""}.`,
      `Learn time management strategies, memory retention tricks, and shortcut formulas for board examinations.`,
      `Comprehensive coverage of previous years' questions (PYQs) and high-probability test patterns.`,
      `Full access to structured study notes, chapter summaries, and interactive revision material.`,
      `Develop strong analytical and critical thinking abilities for scoring top percentile in exams.`,
      `Direct continuous doubt clearing with our AI Tutor and qualified faculty members.`
    ];
  }

  // 2. Requirements (3-4 structured bullet points)
  let requirements = course.requirements;
  if (!Array.isArray(requirements) || requirements.length === 0) {
    requirements = [
      `Basic foundational knowledge of prior class ${subject} concepts.`,
      `A smartphone, tablet, or laptop/PC with stable internet connection for video streaming.`,
      `Notebook and stationery to take notes and practice exercise problems during lectures.`,
      `Consistency and dedication to complete assignments, mock quizzes, and study modules.`
    ];
  }

  // 3. Detailed Description (Rich multi-section formatted text)
  let description = course.description;
  if (!description || description.trim().length < 80) {
    description = `Welcome to ${title}, a masterclass meticulously designed to help students excel in ${subject} for ${category} (${board}).

Whether you are preparing for upcoming school assessments, board examinations, or competitive entrance tests, this course delivers complete, structured, and easy-to-understand video lessons with real-world examples and exam-proven problem solving frameworks.

What makes this course unique:
• Concept-First Teaching: We break down complex theories into simple, bite-sized visual explanations.
• Curated Exam Preparation: Every chapter contains hand-picked high-weightage questions, previous years' board questions, and step-by-step solutions.
• Interactive Revision Material: High-yield downloadable study notes and summaries to boost last-minute revision.
• 24/7 AI Tutor & Faculty Support: Never get stuck on a difficult doubt—get instant AI explanations and 1-on-1 instructor guidance.

Who this course is for:
• Students currently in ${category} studying ${subject} under ${board} curriculum.
• Learners who want to build crystal-clear foundational concepts and score high marks in exams.
• Anyone looking for comprehensive, self-paced revision with top educator notes and problem banks.`;
  }

  // 4. Instructor Bio & Stats
  const instructor = course.instructor || {};
  const instructorName = instructor.name || (typeof instructor === "string" ? instructor : "Senior Faculty");
  const instructorBio =
    instructor.bio ||
    `Expert educator and lead faculty for ${subject} at Umang Vision Academy. Dedicated to simplifying complex concepts, mentoring students towards academic excellence, and delivering top board results.`;

  return {
    whatYouWillLearn,
    requirements,
    description,
    instructorName,
    instructorBio,
  };
}
