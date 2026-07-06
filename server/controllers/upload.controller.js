import ImageKit from "imagekit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import sharp from "sharp";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const rawFolder = req.body.folder || "Umang Vision Academy";
    const folder = "/" + rawFolder.trim().replace(/[^a-zA-Z0-9_\-\/]/g, "_").replace(/\/+/g, "/");
    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    let fileData = req.file.buffer;

    try {
      if (
        req.file.mimetype.startsWith("image/") &&
        req.file.mimetype !== "image/gif"
      ) {
        const pipeline = sharp(fileData).withMetadata();
        if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg") {
          pipeline.jpeg({ quality: 75, mozjpeg: true });
        } else if (req.file.mimetype === "image/png") {
          pipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
        } else if (req.file.mimetype === "image/webp") {
          pipeline.webp({ quality: 75 });
        }
        fileData = await pipeline.toBuffer();
      }
    } catch (compressionError) {
      console.warn(
        "Compression failed, using original buffer:",
        compressionError.message || compressionError,
      );
    }

    const result = await imagekit.upload({
      file: fileData,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    res.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    });
  } catch (err) {
    console.error("ImageKit upload error:", err);
    res.status(500).json({ message: err.message || "Upload failed." });
  }
};

export const getUploadSignature = (req, res) => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    res.json({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      signature: authParams.signature,
      expire: authParams.expire,
      token: authParams.token,
    });
  } catch (err) {
    console.error("ImageKit signature error:", err);
    res.status(500).json({ message: "Failed to generate upload signature." });
  }
};
