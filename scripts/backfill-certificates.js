import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../server/models/user.model.js";
import Course from "../server/models/courses.model.js";
import { deleteKey } from "../server/utils/redisClient.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

async function backfillCertificates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const users = await User.find({ "roles": "student" });
    const courses = await Course.find({ "certificate.enabled": true }).populate("instructor", "name");

    let issuedCount = 0;

    for (const student of users) {
      if (!student.courseProgress) continue;

      let studentModified = false;

      for (const course of courses) {
        const progress = student.courseProgress[course._id.toString()];
        if (!progress || !progress.completed) continue;

        const totalLessons = course.lessons?.length || course.totalLessons || 0;
        const completedCount = progress.completed.length;
        
        if (completedCount >= totalLessons && totalLessons > 0) {
          const requiresFinalQuiz = course.quiz?.questions?.length > 0;
          const hasSubjectQuizzes = course.subjectQuizzes?.length > 0;

          let allPassed = true;
          if (requiresFinalQuiz || hasSubjectQuizzes) {
            allPassed = requiresFinalQuiz
              ? student.quizSubmissions.some(
                  (submission) =>
                    submission.courseId.toString() === course._id.toString() &&
                    submission.title === "Final Quiz"
                )
              : (course.subjectQuizzes || []).every((requiredQuiz) =>
                  student.quizSubmissions.some(
                    (submission) =>
                      submission.courseId.toString() === course._id.toString() &&
                      submission.title === requiredQuiz.title
                  )
                );
          }

          if (allPassed) {
            const alreadyIssued = student.earnedCertificates?.some(
              (c) => c.courseId.toString() === course._id.toString()
            );

            if (!alreadyIssued) {
              if (!student.earnedCertificates) student.earnedCertificates = [];
              student.earnedCertificates.push({
                courseId: course._id,
                courseTitle: course.title,
                issuedAt: new Date(),
                theme: course.certificate?.theme || "purple",
                certificateTitle: course.certificate?.title || "Certificate of Completion",
                signatoryName: course.certificate?.signatoryName || "",
                signatoryTitle: course.certificate?.signatoryTitle || "",
                instructorName: course.instructor?.name || "",
              });
              studentModified = true;
              issuedCount++;
              console.log(`Issued missing certificate for ${course.title} to ${student.email}`);
            }
          }
        }
      }

      if (studentModified) {
        await student.save();
        await deleteKey(`user:${student._id}`).catch(() => {});
      }
    }

    console.log(`Backfill complete. Issued ${issuedCount} certificates.`);
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

backfillCertificates();
