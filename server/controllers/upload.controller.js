import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// UPLOADS_DIR must match the directory served by express.static in server.js:
// app.use("/uploads", express.static(path.join(__dirname_server, "uploads")))
// server.js __dirname = .../server, so uploads live at .../server/uploads
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

export const uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const rawFolder = req.body.folder || "Umang Vision Academy";
    const folder = rawFolder.trim().replace(/[^a-zA-Z0-9_\-\/]/g, "_").replace(/\/+/g, "/").replace(/^\/+/, ''); // Ensure no leading slash for local directory logic
    
    // Create the target directory locally
    const targetDir = path.join(UPLOADS_DIR, folder);
    await fsPromises.mkdir(targetDir, { recursive: true });

    // Sanitize the file name to avoid errors on Windows (e.g. colons, slashes)
    const sanitizedOriginalName = req.file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/_+/g, "_");
      
    const fileName = `${Date.now()}_${sanitizedOriginalName}`;
    const filePath = path.join(targetDir, fileName);
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

    // Save to disk
    await fsPromises.writeFile(filePath, fileData);

    // Construct the local URL
    const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;

    res.json({
      url: fileUrl,
      fileId: `${folder}/${fileName}`, // Store relative path as ID for easy deletion
      name: fileName,
    });
  } catch (err) {
    console.error("Local upload error:", err);
    res.status(500).json({ message: err.message || "Upload failed." });
  }
};
