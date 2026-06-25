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
      index: true,
    },
  },
  { timestamps: true },
);

const Reference = model("Reference", referenceSchema);

export default Reference;
