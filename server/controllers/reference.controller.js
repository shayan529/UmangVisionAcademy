import Reference from "../models/reference.model.js";
import User from "../models/user.model.js";
import { hasBaseRole, hasPermissionGrant } from "../utils/userRoles.js";

const isAdminOrStaff = (user) =>
  hasBaseRole(user, "admin") ||
  hasPermissionGrant(user, "references", "view") ||
  hasPermissionGrant(user, "references", "edit") ||
  hasPermissionGrant(user, "references", "create");

export const listReferences = async (req, res) => {
  try {
    const isStaffOrAdmin = isAdminOrStaff(req.user);
    const filter = isStaffOrAdmin ? {} : { isActive: { $ne: false } };

    const items = await Reference.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate user counts matching reference names
    const userCountAggregation = await User.aggregate([
      { $match: { reference: { $exists: true, $ne: "" } } },
      { $group: { _id: "$reference", count: { $sum: 1 } } },
    ]);

    const countsMap = new Map(
      userCountAggregation.map((item) => [String(item._id).toLowerCase(), item.count])
    );

    const enrichedItems = items.map((item) => ({
      ...item,
      userCount: countsMap.get(item.name.toLowerCase()) || 0,
    }));

    res.json(enrichedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReferenceById = async (req, res) => {
  try {
    const isStaffOrAdmin = isAdminOrStaff(req.user);
    const filter = isStaffOrAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, isActive: { $ne: false } };

    const item = await Reference.findOne(filter)
      .populate("createdBy", "name email role")
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Reference not found" });
    }

    const userCount = await User.countDocuments({ reference: item.name });

    res.json({ ...item, userCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createReference = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = String(req.body?.category || "General").trim();
    const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : true;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const createdDoc = await Reference.create({
      name,
      description,
      category,
      isActive,
      createdBy: req.user._id,
    });

    const populated = await Reference.findById(createdDoc._id)
      .populate("createdBy", "name email role")
      .lean();

    res.status(201).json({ ...populated, userCount: 0 });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReference = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = req.body?.description !== undefined ? String(req.body.description).trim() : undefined;
    const category = req.body?.category !== undefined ? String(req.body.category).trim() : undefined;
    const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : undefined;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const isStaffOrAdmin =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "references", "edit");

    const filter = isStaffOrAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, createdBy: req.user._id };

    const updateFields = { name };
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updated = await Reference.findOneAndUpdate(filter, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email role")
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Reference not found" });
    }

    const userCount = await User.countDocuments({ reference: updated.name });

    res.json({ ...updated, userCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteReference = async (req, res) => {
  try {
    const isStaffOrAdmin =
      hasBaseRole(req.user, "admin") ||
      hasPermissionGrant(req.user, "references", "delete");

    const filter = isStaffOrAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, createdBy: req.user._id };

    const deleted = await Reference.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ message: "Reference not found" });
    }

    res.json({ message: "Reference deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
