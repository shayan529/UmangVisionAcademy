import test from "node:test";
import assert from "node:assert/strict";
import { getPYQAccessResult } from "../utils/pyqAccess.js";

test("2025 remains free for everyone", () => {
  const result = getPYQAccessResult({
    year: 2025,
    purchasedPYQs: [],
    enrolledCourses: [],
    className: "Class 10",
    subject: "Mathematics",
  });

  assert.equal(result.access, true);
  assert.equal(result.reason, "free_year");
  assert.equal(result.price, 20);
});

test("matching purchased course unlocks all paid papers", () => {
  const result = getPYQAccessResult({
    year: 2024,
    purchasedPYQs: [],
    enrolledCourses: [{ title: "Mathematics", category: "Class 10" }],
    className: "Class 10",
    subject: "Mathematics",
  });

  assert.equal(result.access, true);
  assert.equal(result.reason, "course_enrolled");
  assert.equal(result.price, 20);
});

test("a purchased paper remains accessible without re-paying", () => {
  const result = getPYQAccessResult({
    year: 2023,
    purchasedPYQs: ["CBSE_Class 10_Mathematics_2023"],
    enrolledCourses: [],
    className: "Class 10",
    subject: "Mathematics",
    board: "CBSE",
  });

  assert.equal(result.access, true);
  assert.equal(result.reason, "purchased");
});
