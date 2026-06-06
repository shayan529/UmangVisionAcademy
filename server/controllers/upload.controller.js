import ImageKit from "imagekit";
import fs from "fs";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const folder = req.body.folder || "skillsphere";
    const fileData = fs.readFileSync(req.file.path);
    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;

    const result = await imagekit.upload({
      file: fileData,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    });
  } catch (err) {
    // Clean up temp file if upload failed
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("ImageKit upload error:", err);
    res.status(500).json({ message: err.message || "Upload failed." });
  }
};
