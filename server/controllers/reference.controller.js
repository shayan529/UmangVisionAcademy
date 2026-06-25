import Reference from "../models/reference.model.js";

export const listReferences = async (req, res) => {
  try {
    const items = await Reference.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReferenceById = async (req, res) => {
  try {
    const item = await Reference.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Reference not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createReference = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const created = await Reference.create({
      name,
      createdBy: req.user._id,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReference = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updated = await Reference.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Reference not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteReference = async (req, res) => {
  try {
    const deleted = await Reference.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Reference not found" });
    }

    res.json({ message: "Reference deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
