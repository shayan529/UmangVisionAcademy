// controllers/questionPaper.controller.js
import QuestionPaper from "../models/questionPaper.model.js";
import ImageKit from "imagekit";
import streamifier from "streamifier";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadQuestionPaper = async (req, res) => {
  try {
    const { board, class: cls, subject, year } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });
    if (!board || !cls || !subject || !year)
      return res.status(400).json({ message: "All fields are required." });

    const fileName = `${board}-${cls}-${subject}-${year}.pdf`.replace(
      /\s+/g,
      "_",
    );

    // Upload buffer to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName,
      folder: "/question-papers",
      useUniqueFileName: false, // overwrite same name = same board+class+subject+year
    });

    const paper = await QuestionPaper.findOneAndUpdate(
      { board, class: cls, subject, year: Number(year) },
      {
        board,
        class: cls,
        subject,
        year: Number(year),
        fileUrl: uploadResponse.url,
        fileId: uploadResponse.fileId, // store for deletion
        fileName: uploadResponse.name,
        uploadedBy: req.user._id,
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ message: "Uploaded successfully.", paper });
  } catch (err) {
    console.error("[uploadQuestionPaper]", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllQuestionPapers = async (req, res) => {
  try {
    const papers = await QuestionPaper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuestionPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found." });

    // Delete from ImageKit too
    if (paper.fileId) {
      await imagekit.deleteFile(paper.fileId);
    }

    await paper.deleteOne();
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuestionPapers = async (req, res) => {
  try {
    const { board, class: cls } = req.query;
    const filter = {};
    if (board && board !== "All") filter.board = board;
    if (cls && cls !== "All") filter.class = cls;
    const papers = await QuestionPaper.find(filter);
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
