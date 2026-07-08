import api from "../config/api.js";

const sanitizeFolderValue = (folder = "Umang Vision Academy") => {
  return folder
    .trim()
    .replace(/^\/*/, "")
    .replace(/\\/g, "/")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-/]/g, "");
};

export const uploadToImageKit = async ({
  file,
  folder = "Umang Vision Academy",
  onUploadProgress,
}) => {
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("folder", sanitizeFolderValue(folder));

  // Note: we still call the function uploadToImageKit to avoid massive refactoring,
  // but it now uploads to our local server endpoint.
  const response = await api.post("/upload/local", uploadData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return response.data;
};
