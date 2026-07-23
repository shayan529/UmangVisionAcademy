import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env and .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const token =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error("❌ ERROR: BLOB_READ_WRITE_TOKEN is missing from environment variables.");
  console.error("Please ensure BLOB_READ_WRITE_TOKEN is defined in server/.env or .env.local before running this script.");
  process.exit(1);
}

const uploadsDir = path.resolve(__dirname, "../uploads");
const tmpUploadsDir = path.resolve(__dirname, "../.tmp/uploads");

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function scanFilesRecursively(dirPath, baseDir = dirPath, results = []) {
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".gitkeep" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanFilesRecursively(fullPath, baseDir, results);
    } else if (entry.isFile()) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      results.push({ fullPath, pathname: relativePath });
    }
  }
  return results;
}

async function uploadAllLocalFiles() {
  console.log("🚀 Scanning local uploads directories...");
  console.log(`📁 Primary uploads dir: ${uploadsDir}`);

  const primaryFiles = scanFilesRecursively(uploadsDir);
  const tmpFiles = scanFilesRecursively(tmpUploadsDir, tmpUploadsDir).map(item => ({
    fullPath: item.fullPath,
    pathname: `tmp/${item.pathname}`
  }));

  const allFiles = [...primaryFiles, ...tmpFiles];

  if (allFiles.length === 0) {
    console.log("ℹ️ No local upload files found to migrate.");
    return;
  }

  console.log(`\nFound ${allFiles.length} file(s) to upload to Vercel Blob:\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const { fullPath, pathname } = allFiles[i];
    const contentType = getMimeType(fullPath);
    console.log(`[${i + 1}/${allFiles.length}] Uploading: ${pathname}`);

    try {
      const fileBuffer = fs.readFileSync(fullPath);
      const blob = await put(pathname, fileBuffer, {
        access: "public",
        token,
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      console.log(`   ✅ Success! Blob URL: ${blob.url}`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message || err}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Upload Migration Completed!`);
  console.log(`   - Successful uploads: ${successCount}`);
  console.log(`   - Failed uploads: ${failCount}`);
}

uploadAllLocalFiles().catch((err) => {
  console.error("Fatal error during upload migration:", err);
  process.exit(1);
});
