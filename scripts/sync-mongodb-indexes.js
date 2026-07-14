import { existsSync } from "node:fs";
import { resolve } from "node:path";
import AiChatMessage from "../server/models/aiChatMessage.model.js";
import Achievement from "../server/models/achievement.model.js";
import Course from "../server/models/courses.model.js";
import InstructorApplication from "../server/models/instructorApplication.model.js";
import MockTest from "../server/models/mockTest.model.js";
import MockTestAttempt from "../server/models/mockTestAttempt.model.js";
import Note from "../server/models/note.model.js";
import Reel from "../server/models/reel.model.js";
import Reference from "../server/models/reference.model.js";
import Session from "../server/models/session.model.js";
import { SessionMessage } from "../server/utils/SessionChatSocket.js";
import User from "../server/models/user.model.js";

const envPath = resolve("server/.env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const models = [
  AiChatMessage,
  Achievement,
  Course,
  InstructorApplication,
  MockTest,
  MockTestAttempt,
  Note,
  Reel,
  Reference,
  Session,
  SessionMessage,
  User,
];
const mongoose = Course.base;
const apply = process.argv.includes("--apply");

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI must be set in server/.env or the environment.");
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  for (const model of models) {
    if (apply) {
      const dropped = await model.syncIndexes();
      console.log(`${model.modelName}: synchronized; dropped [${dropped.join(", ") || "none"}]`);
    } else {
      const existing = await model.listIndexes();
      console.log(`${model.modelName}: ${existing.map((index) => index.name).join(", ")}`);
    }
  }

  if (!apply) console.log("Dry run only. Re-run with --apply to create new indexes and drop superseded ones.");
} finally {
  await mongoose.disconnect();
}
