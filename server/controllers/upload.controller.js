import fsPromises from "fs/promises";
import sharp from "sharp";
import { uploadFileToStorage } from "../utils/vercelBlob.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const rawFolder = req.body.folder || "Umang Vision Academy";
    const folder = rawFolder.trim().replace(/[^a-zA-Z0-9_\-\/]/g, "_").replace(/\/+/g, "/").replace(/^\/+/, '');
    const fileName = req.file.filename || `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

    let compressedBuffer = null;

    try {
      if (
        req.file.mimetype.startsWith("image/") &&
        req.file.mimetype !== "image/gif"
      ) {
        const inputSource = req.file.path || req.file.buffer;
        if (inputSource) {
          const pipeline = sharp(inputSource).withMetadata();
          if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg") {
            pipeline.jpeg({ quality: 75, mozjpeg: true });
          } else if (req.file.mimetype === "image/png") {
            pipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
          } else if (req.file.mimetype === "image/webp") {
            pipeline.webp({ quality: 75 });
          }
          compressedBuffer = await pipeline.toBuffer();
        }
      }
    } catch (compressionError) {
      console.warn(
        "Compression failed, using original file:",
        compressionError.message || compressionError
      );
    }

    const uploadResult = await uploadFileToStorage({
      folder,
      fileName,
      buffer: compressedBuffer || req.file.buffer,
      filePath: !compressedBuffer && req.file.path ? req.file.path : undefined,
      contentType: req.file.mimetype,
    });

    // Clean up temporary file if diskStorage was used
    if (req.file.path) {
      await fsPromises.unlink(req.file.path).catch((e) =>
        console.error("Temp file cleanup failed:", e)
      );
    }

    res.json({
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      name: uploadResult.name,
      storageProvider: uploadResult.storageProvider,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: err.message || "Upload failed." });
  }
};

