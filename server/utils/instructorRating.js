import Course from "../models/courses.model.js";

/**
 * Computes the derived instructor rating and total review count.
 * @param {string} instructorId
 * @returns {Promise<{avgRating: number|null, ratingCount: number}>}
 */
export const computeInstructorRating = async (instructorId) => {
  if (!instructorId) {
    return { avgRating: null, ratingCount: 0 };
  }

  const courses = await Course.find({
    instructor: instructorId,
    published: true,
    approvalStatus: "approved",
  }).select("ratingAverage reviewCount");

  const ratedCourses = courses.filter((c) => (c.reviewCount ?? 0) > 0);
  if (ratedCourses.length === 0) {
    return { avgRating: null, ratingCount: 0 };
  }

  const totalReviews = ratedCourses.reduce((sum, c) => sum + (c.reviewCount ?? 0), 0);
  const weightedSum = ratedCourses.reduce(
    (sum, c) => sum + (c.ratingAverage ?? 0) * (c.reviewCount ?? 0),
    0,
  );

  const avgRating = totalReviews > 0 ? Number((weightedSum / totalReviews).toFixed(1)) : null;
  return { avgRating, ratingCount: totalReviews };
};
