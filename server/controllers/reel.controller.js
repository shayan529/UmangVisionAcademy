import Reel from "../models/reel.model.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";
import { cacheResponse, invalidateCache } from "../utils/redisClient.js";

export const createReel = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail } = req.body;
    if (!videoUrl)
      return res.status(400).json({ message: "videoUrl required" });

    const reel = await Reel.create({
      title,
      description,
      videoUrl,
      thumbnail,
      instructor: req.user._id,
      instructorName: req.user.name || req.user.email || "Instructor",
      status: "pending",
    });

    res.json(reel);
  } catch (err) {
    console.error("createReel", err);
    res.status(500).json({ message: err.message || "Failed to create reel" });
  }
};

export const listReels = async (req, res) => {
  try {
    const isModerator = req.user && (hasBaseRole(req.user, "admin") || hasPermissionGrant(req.user, "reels", "view"));
    const isInstructor = req.user && hasBaseRole(req.user, "instructor");

    // If the user is moderator/admin, allow query param ?all to view all reels
    if (isModerator && req.query.all === "1") {
      const all = await Reel.find().sort({ createdAt: -1 }).lean();
      return res.json(all);
    }

    // If instructor and ?mine=1, return their reels
    if (isInstructor && req.query.mine === "1") {
      const mine = await Reel.find({ instructor: req.user._id }).sort({
        createdAt: -1,
      });
      return res.json(mine);
    }

    // Public listing — only approved reels
    const reels = await cacheResponse("reels:public", 30, async () => {
      return await Reel.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .lean();
    });

    if (process.env.NODE_ENV === "production") {
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=300, stale-while-revalidate=600");
    }

    res.json(reels);
  } catch (err) {
    console.error("listReels", err);
    res.status(500).json({ message: err.message || "Failed to list reels" });
  }
};

export const getReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    // increase view count for public access
    reel.views = (reel.views || 0) + 1;
    await reel.save();
    res.json(reel);
  } catch (err) {
    console.error("getReel", err);
    res.status(500).json({ message: err.message || "Failed to get reel" });
  }
};


export const approveReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    reel.status = "approved";
    reel.rejectedReason = undefined;
    await reel.save();
    await invalidateCache("reels:public*");
    res.json(reel);
  } catch (err) {
    console.error("approveReel", err);
    res.status(500).json({ message: err.message || "Failed to approve" });
  }
};

export const rejectReel = async (req, res) => {
  try {
    const { reason } = req.body;
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    reel.status = "rejected";
    reel.rejectedReason = reason || "";
    await reel.save();
    await invalidateCache("reels:public*");
    res.json(reel);
  } catch (err) {
    console.error("rejectReel", err);
    res.status(500).json({ message: err.message || "Failed to reject" });
  }
};

export const unapproveReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Not found" });
    reel.status = "pending";
    reel.rejectedReason = undefined;
    await reel.save();
    await invalidateCache("reels:public*");
    res.json(reel);
  } catch (err) {
    console.error("unapproveReel", err);
    res.status(500).json({ message: err.message || "Failed to unapprove" });
  }
};
