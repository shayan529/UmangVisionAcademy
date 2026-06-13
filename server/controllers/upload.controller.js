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

const compressImage = async (sourcePath, targetPath, mimetype) => {
  const pipeline = sharp(sourcePath).withMetadata();

  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    pipeline.jpeg({ quality: 75, mozjpeg: true });
  } else if (mimetype === "image/png") {
    pipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
  } else if (mimetype === "image/webp") {
    pipeline.webp({ quality: 75 });
  } else {
    return sourcePath;
  }

  await pipeline.toFile(targetPath);
  return targetPath;
};

const getCompressedPath = (filePath, ext) => `${filePath}.compressed${ext}`;

export const uploadFile = async (req, res) => {
  let compressedPath = null;
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const folder = req.body.folder || "Umang Vision Academy";
    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const sourcePath = req.file.path;
    const originalExt =
      path.extname(req.file.originalname) || path.extname(sourcePath);
    let uploadPath = sourcePath;

    try {
      if (
        req.file.mimetype.startsWith("image/") &&
        req.file.mimetype !== "image/gif"
      ) {
        compressedPath = getCompressedPath(sourcePath, originalExt);
        await compressImage(sourcePath, compressedPath, req.file.mimetype);
        uploadPath = compressedPath;
      }
    } catch (compressionError) {
      console.warn(
        "Compression failed, falling back to original file:",
        compressionError.message || compressionError,
      );
      uploadPath = sourcePath;
      if (compressedPath && fs.existsSync(compressedPath)) {
        await fsPromises.unlink(compressedPath).catch(() => {});
        compressedPath = null;
      }
    }

    const fileData = await fsPromises.readFile(uploadPath);
    const result = await imagekit.upload({
      file: fileData,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    if (fs.existsSync(sourcePath)) await fsPromises.unlink(sourcePath);
    if (compressedPath && fs.existsSync(compressedPath))
      await fsPromises.unlink(compressedPath);

    res.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      await fsPromises.unlink(req.file.path).catch(() => {});
    }
    if (compressedPath && fs.existsSync(compressedPath)) {
      await fsPromises.unlink(compressedPath).catch(() => {});
    }
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
