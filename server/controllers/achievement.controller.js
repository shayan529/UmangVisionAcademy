import Achievement from "../models/achievement.model.js";
import { cacheResponse, deleteKey } from "../utils/redisClient.js";

// ── Fetch user's achievements with earned badges ──
export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cacheKey = `user:achievements:${userId}`;
    const cachedData = await cacheResponse(cacheKey, 300, async () => {
      const achievements = await Achievement.find({ userId }).sort({
        earnedAt: -1,
      });

      // Map to frontend format
      const earnedBadges = {};
      achievements.forEach((ach) => {
        earnedBadges[ach.badgeId] = {
          earnedAt: ach.earnedAt,
          viewed: ach.viewed,
          _id: ach._id,
        };
      });

      return {
        earnedBadges,
        totalEarned: achievements.length,
      };
    });

    res.json({
      success: true,
      ...cachedData,
    });
  } catch (error) {
    console.error("❌ getUserAchievements error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch achievements",
    });
  }
};

// ── Check and award achievements based on user activity ──
export const checkAndAwardAchievements = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      lessonsCompleted,
      mockTestsCompleted,
      loginStreak,
      perfectQuiz,
      fullMarks,
      firstLogin,
      earlyBird,
      speedLesson,
      leaderboardFirst,
      textLessons,
      nightStudy,
    } = req.body;

    const newAchievements = [];

    // Helper: award badge if not already earned
    const awardBadge = async (badgeId) => {
      const existing = await Achievement.findOne({ userId, badgeId });
      if (!existing) {
        const achievement = new Achievement({
          userId,
          badgeId,
          earnedAt: new Date(),
        });
        await achievement.save();
        newAchievements.push(badgeId);
      }
    };

    // Check conditions and award
    if (firstLogin) await awardBadge("first_login");
    if (lessonsCompleted >= 1) await awardBadge("first_lesson");
    if (perfectQuiz) await awardBadge("quiz_champ");
    if (earlyBird) await awardBadge("early_bird");
    if (loginStreak >= 7) await awardBadge("week_warrior");
    if (speedLesson) await awardBadge("speed_reader");
    if (leaderboardFirst) await awardBadge("top_of_class");
    if (textLessons >= 10) await awardBadge("bookworm");
    if (mockTestsCompleted >= 5) await awardBadge("test_titan");
    if (nightStudy) await awardBadge("night_owl");
    if (fullMarks) await awardBadge("full_marks");

    // Check for legend (all other badges)
    const allAchievements = await Achievement.find({ userId }).sort({
      earnedAt: -1,
    });
    if (allAchievements.length >= 11) {
      await awardBadge("legend");
    }

    const updatedAchievements = await Achievement.find({ userId }).sort({
      earnedAt: -1,
    });

    // Invalidate achievements cache
    await deleteKey(`user:achievements:${userId}`);

    const earnedBadges = {};
    updatedAchievements.forEach((ach) => {
      earnedBadges[ach.badgeId] = {
        earnedAt: ach.earnedAt,
        viewed: ach.viewed,
        _id: ach._id,
      };
    });

    res.json({
      success: true,
      newAchievements,
      earnedBadges,
      totalEarned: updatedAchievements.length,
      message:
        newAchievements.length > 0
          ? `${newAchievements.length} new badge(s) unlocked!`
          : "No new achievements",
    });
  } catch (error) {
    console.error("❌ checkAndAwardAchievements error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check achievements",
    });
  }
};

// ── Mark achievements as viewed ──
export const markAchievementsViewed = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { badgeIds } = req.body;

    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return res.status(400).json({ message: "badgeIds array required" });
    }

    await Achievement.updateMany(
      { userId, badgeId: { $in: badgeIds } },
      { viewed: true },
    );

    // Invalidate achievements cache
    await deleteKey(`user:achievements:${userId}`);

    res.json({
      success: true,
      message: "Achievements marked as viewed",
    });
  } catch (error) {
    console.error("❌ markAchievementsViewed error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update achievements",
    });
  }
};
