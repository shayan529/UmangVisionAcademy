import api from "../config/api.js";

const sanitizeFolderValue = (folder = "uploads") => {
  return folder
    .trim()
    .replace(/^\/*/, "")
    .replace(/\\/g, "/")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-/]/g, "");
};

/**
 * Upload a file to the local server's /api/upload/local endpoint.
 *
 * @param {Object} options
 * @param {File}     options.file               - The File object to upload
 * @param {string}  [options.folder]            - Sub-folder under server/uploads/
 * @param {Function}[options.onUploadProgress]  - Axios progress callback (ProgressEvent)
 * @returns {Promise<{ url: string, fileId: string, name: string }>}
 */
export const uploadFile = async ({
  file,
  folder = "uploads",
  onUploadProgress,
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", sanitizeFolderValue(folder));

  const response = await api.post("/upload/local", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data; // { url, fileId, name }
};

// Legacy alias so any remaining callers that import uploadToImageKit still work
// without an immediate rename — remove once all imports are updated.
export const uploadToImageKit = uploadFile;
