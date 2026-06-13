// controllers/mockTestController.js
import MockTest from "../models/MockTest.js";
import MockTestAttempt from "../models/MockTestAttempt.js";

// ─── INSTRUCTOR ──────────────────────────────────────────────────────────────

// POST /api/mock-tests  (instructor creates a test)
export const createMockTest = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      class: className,
      board,
      duration,
      totalMarks,
      passingMarks,
      questions,
      tags,
      difficulty,
    } = req.body;

    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one question is required" });
    }

    const mockTest = await MockTest.create({
      title,
      description,
      subject,
      class: className,
      board,
      duration,
      totalMarks,
      passingMarks,
      questions,
      tags,
      difficulty,
      instructor: req.user._id,
      isPublished: false,
    });

    res.status(201).json({ success: true, mockTest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/mock-tests/:id/publish  (toggle publish)
export const togglePublish = async (req, res) => {
  try {
    const test = await MockTest.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });

    test.isPublished = !test.isPublished;
    await test.save();
    res.json({ success: true, isPublished: test.isPublished });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/instructor  (instructor's own tests)
export const getInstructorTests = async (req, res) => {
  try {
    const tests = await MockTest.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/mock-tests/:id  (update)
export const updateMockTest = async (req, res) => {
  try {
    const test = await MockTest.findOneAndUpdate(
      { _id: req.params.id, instructor: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/mock-tests/:id
export const deleteMockTest = async (req, res) => {
  try {
    const test = await MockTest.findOneAndDelete({
      _id: req.params.id,
      instructor: req.user._id,
    });
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    res.json({ success: true, message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STUDENT ─────────────────────────────────────────────────────────────────

// GET /api/mock-tests  (available published tests for students)
export const getAvailableTests = async (req, res) => {
  try {
    const { subject, class: className, board, difficulty } = req.query;
    const filter = { isPublished: true };
    if (subject) filter.subject = subject;
    if (className) filter.class = className;
    if (board) filter.board = { $in: [board, "All"] };
    if (difficulty) filter.difficulty = difficulty;

    const tests = await MockTest.find(filter)
      .select("-questions.correctOption -questions.explanation") // hide answers
      .populate("instructor", "name")
      .sort({ createdAt: -1 });

    // Attach student's attempt status for each test
    const testIds = tests.map((t) => t._id);
    const attempts = await MockTestAttempt.find({
      student: req.user._id,
      mockTest: { $in: testIds },
      status: "completed",
    }).select("mockTest score percentage passed");

    const attemptMap = {};
    attempts.forEach((a) => {
      attemptMap[a.mockTest.toString()] = a;
    });

    const testsWithStatus = tests.map((t) => ({
      ...t.toObject(),
      attemptInfo: attemptMap[t._id.toString()] || null,
    }));

    res.json({ success: true, tests: testsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/:id/start  (start/resume — returns questions without answers)
export const startTest = async (req, res) => {
  try {
    const test = await MockTest.findOne({
      _id: req.params.id,
      isPublished: true,
    });
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });

    // Check for existing in-progress attempt
    let attempt = await MockTestAttempt.findOne({
      mockTest: test._id,
      student: req.user._id,
      status: "in-progress",
    });

    if (!attempt) {
      attempt = await MockTestAttempt.create({
        mockTest: test._id,
        student: req.user._id,
        totalMarks: test.totalMarks,
        startedAt: new Date(),
        answers: [],
      });
    }

    // Strip correct answers from questions
    const safeQuestions = test.questions.map((q, i) => ({
      _id: q._id,
      index: i,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
    }));

    res.json({
      success: true,
      attemptId: attempt._id,
      test: {
        _id: test._id,
        title: test.title,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        questions: safeQuestions,
      },
      startedAt: attempt.startedAt,
      existingAnswers: attempt.answers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/mock-tests/attempts/:attemptId/submit
export const submitTest = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body; // answers: [{questionIndex, selectedOption}]

    const attempt = await MockTestAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
      status: "in-progress",
    });
    if (!attempt)
      return res
        .status(404)
        .json({ success: false, message: "Active attempt not found" });

    const test = await MockTest.findById(attempt.mockTest);

    let score = 0;
    const gradedAnswers = answers.map((a) => {
      const question = test.questions[a.questionIndex];
      const isCorrect = question && a.selectedOption === question.correctOption;
      const marksEarned = isCorrect ? question.marks : 0;
      score += marksEarned;
      return {
        questionIndex: a.questionIndex,
        selectedOption: a.selectedOption,
        isCorrect,
        marksEarned,
      };
    });

    const percentage = Math.round((score / test.totalMarks) * 100);
    const passed = score >= test.passingMarks;

    attempt.answers = gradedAnswers;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.timeTaken = timeTaken;
    attempt.submittedAt = new Date();
    attempt.status = "completed";
    await attempt.save();

    // Increment test attempt counter
    await MockTest.findByIdAndUpdate(test._id, { $inc: { attempts: 1 } });

    res.json({
      success: true,
      result: {
        score,
        totalMarks: test.totalMarks,
        percentage,
        passed,
        passingMarks: test.passingMarks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/attempts/:attemptId/result  (detailed result with explanations)
export const getAttemptResult = async (req, res) => {
  try {
    const attempt = await MockTestAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
      status: "completed",
    }).populate("mockTest");

    if (!attempt)
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });

    const test = attempt.mockTest;

    // Full questions with correct answers + explanations for review
    const questionsWithReview = test.questions.map((q, i) => {
      const studentAnswer = attempt.answers.find((a) => a.questionIndex === i);
      return {
        index: i,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: q.marks,
        studentSelectedOption: studentAnswer?.selectedOption ?? null,
        isCorrect: studentAnswer?.isCorrect ?? false,
        marksEarned: studentAnswer?.marksEarned ?? 0,
      };
    });

    res.json({
      success: true,
      result: {
        attemptId: attempt._id,
        testTitle: test.title,
        subject: test.subject,
        class: test.class,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        passingMarks: test.passingMarks,
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt,
        questions: questionsWithReview,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/my-results  (student's all completed attempts)
export const getMyResults = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({
      student: req.user._id,
      status: "completed",
    })
      .populate("mockTest", "title subject class difficulty totalMarks")
      .sort({ submittedAt: -1 });

    res.json({ success: true, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/:testId/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({
      mockTest: req.params.testId,
      status: "completed",
    })
      .populate("student", "name email")
      .sort({ score: -1, timeTaken: 1 }) // highest score, fastest first
      .limit(50);

    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      studentName:
        a.student?.name || a.student?.email?.split("@")[0] || "Student",
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      timeTaken: a.timeTaken,
      passed: a.passed,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mock-tests/analytics  (student's overall analytics)
export const getStudentAnalytics = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({
      student: req.user._id,
      status: "completed",
    }).populate("mockTest", "title subject difficulty totalMarks");

    if (attempts.length === 0) {
      return res.json({ success: true, analytics: null });
    }

    const totalTests = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalMaxScore = attempts.reduce((sum, a) => sum + a.totalMarks, 0);
    const avgPercentage = Math.round((totalScore / totalMaxScore) * 100);
    const passCount = attempts.filter((a) => a.passed).length;

    // Subject-wise breakdown
    const subjectMap = {};
    attempts.forEach((a) => {
      const sub = a.mockTest?.subject || "Unknown";
      if (!subjectMap[sub])
        subjectMap[sub] = { total: 0, score: 0, maxScore: 0, count: 0 };
      subjectMap[sub].total++;
      subjectMap[sub].score += a.score;
      subjectMap[sub].maxScore += a.totalMarks;
      subjectMap[sub].count++;
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([sub, data]) => ({
      subject: sub,
      tests: data.total,
      avgPercentage: Math.round((data.score / data.maxScore) * 100),
    }));

    // Recent 5 attempts for trend chart
    const recentAttempts = attempts.slice(-5).map((a) => ({
      testTitle: a.mockTest?.title || "Test",
      percentage: a.percentage,
      date: a.submittedAt,
    }));

    res.json({
      success: true,
      analytics: {
        totalTests,
        avgPercentage,
        passCount,
        passRate: Math.round((passCount / totalTests) * 100),
        subjectBreakdown,
        recentAttempts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
