import { put, del } from "@vercel/blob";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const isVercelEnvironment = () => {
  return Boolean(
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV ||
    __dirname.includes("/var/task")
  );
};

/**
 * Checks if Vercel Blob storage is configured via environment variables.
 * Vercel automatically populates BLOB_READ_WRITE_TOKEN when Blob storage is attached.
 */
export const isVercelBlobConfigured = () => {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN
  );
};

/**
 * Uploads a file to Vercel Blob storage if configured, falling back to local disk storage.
 * 
 * @param {Object} options
 * @param {string} options.folder - Destination folder/category (e.g. 'question-papers', 'instructor-resumes')
 * @param {string} options.fileName - Target file name
 * @param {Buffer} [options.buffer] - File content as a Buffer
 * @param {string} [options.filePath] - File path on disk if buffer is not provided
 * @param {string} [options.contentType] - MIME type of the file
 * @returns {Promise<{url: string, fileId: string, name: string, storageProvider: string}>}
 */
export const uploadFileToStorage = async ({
  folder = "general",
  fileName,
  buffer,
  filePath,
  contentType,
}) => {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  const pathname = `${folder}/${fileName}`;

  if (token) {
    try {
      let dataToUpload = buffer;
      if (!dataToUpload && filePath) {
        dataToUpload = await fsPromises.readFile(filePath);
      }

      if (!dataToUpload) {
        throw new Error("No buffer or filePath provided for Vercel Blob upload.");
      }

      const blob = await put(pathname, dataToUpload, {
        access: "public",
        token,
        contentType,
      });

      return {
        url: blob.url,
        fileId: blob.url,
        name: fileName,
        storageProvider: "vercel_blob",
      };
    } catch (err) {
      console.error("[Vercel Blob Upload Error]:", err.message || err);
      if (isVercelEnvironment()) {
        throw new Error(`Vercel Blob Upload Failed: ${err.message || err}`);
      }
    }
  }

  if (isVercelEnvironment()) {
    throw new Error(
      "Vercel Blob Storage token (BLOB_READ_WRITE_TOKEN) is not configured in your Vercel project environment variables. Please attach a Vercel Blob store to this project in the Vercel Dashboard."
    );
  }

  // Fallback: Save to Local Storage (only allowed in local development)
  const targetDir = path.join(UPLOADS_DIR, folder);
  await fsPromises.mkdir(targetDir, { recursive: true });
  const localFilePath = path.join(targetDir, fileName);

  if (buffer) {
    await fsPromises.writeFile(localFilePath, buffer);
  } else if (filePath) {
    await fsPromises.copyFile(filePath, localFilePath);
  }

  const baseUrl =
    process.env.SERVER_URL || "http://localhost:5000";
  const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;

  return {
    url: fileUrl,
    fileId: `${folder}/${fileName}`,
    name: fileName,
    storageProvider: "local",
  };
};

/**
 * Deletes a file from Vercel Blob or local disk storage.
 * 
 * @param {string} fileUrlOrId - Vercel Blob URL or local relative fileId
 */
export const deleteFileFromStorage = async (fileUrlOrId) => {
  if (!fileUrlOrId) return;

  const token =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (
    typeof fileUrlOrId === "string" &&
    (fileUrlOrId.includes("vercel-storage.com") || fileUrlOrId.startsWith("http"))
  ) {
    if (fileUrlOrId.includes("vercel-storage.com") && token) {
      try {
        await del(fileUrlOrId, { token });
        return;
      } catch (err) {
        console.error("[Vercel Blob Delete Error]:", err.message || err);
      }
    }
  }

  // Local Storage Deletion Fallback
  if (!isVercelEnvironment()) {
    try {
      const relativePath = fileUrlOrId.startsWith("http")
        ? fileUrlOrId.split("/uploads/")[1]
        : fileUrlOrId;

      if (relativePath) {
        const localPath = path.join(UPLOADS_DIR, relativePath);
        await fsPromises.unlink(localPath).catch(() => {});
      }
    } catch (err) {
      console.error("[Local Storage Delete Error]:", err.message || err);
    }
  }
};
