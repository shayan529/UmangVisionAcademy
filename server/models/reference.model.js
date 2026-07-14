import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const referenceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// User-owned references are always read newest first.
referenceSchema.index({ createdBy: 1, createdAt: -1 });

const Reference = model("Reference", referenceSchema);

export default Reference;
