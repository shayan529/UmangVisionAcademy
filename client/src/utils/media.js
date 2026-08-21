/**
 * Normalizes video URLs to ensure Vercel Blob, ImageKit, Cloudinary, and local storage URLs play properly.
 */
const VERCEL_BLOB_BASE = "https://rfo7jqxbmriqdgqo.public.blob.vercel-storage.com";
const LOCAL_API_BASE = "http://localhost:5000";

const isLocalEnv = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  }
  return process.env.NODE_ENV !== "production";
};

export const normalizeVideoUrl = (rawUrl) => {
  if (!rawUrl) return "";
  let url = String(rawUrl).trim();

  // Fix typo if old incorrect domain was stored
  if (url.includes("rfo7jqbmriqdgqo.public.blob.vercel-storage.com")) {
    url = url.replace("rfo7jqbmriqdgqo.public.blob.vercel-storage.com", "rfo7jqxbmriqdgqo.public.blob.vercel-storage.com");
  }

  const isLocal = isLocalEnv();

  // Handle local /uploads/ or relative paths
  if (url.startsWith("/uploads/")) {
    url = isLocal ? `${LOCAL_API_BASE}${url}` : `${VERCEL_BLOB_BASE}${url}`;
  } else if (url.startsWith("uploads/")) {
    url = isLocal ? `${LOCAL_API_BASE}/${url}` : `${VERCEL_BLOB_BASE}/${url}`;
  } else if (url.includes("/uploads/") && !url.includes("vercel-storage.com")) {
    if (!isLocal) {
      const match = url.match(/\/uploads\/(.+)$/);
      if (match && match[1]) {
        url = `${VERCEL_BLOB_BASE}/${match[1]}`;
      }
    }
  }

  // If Vercel Blob URL has query params like ?download=1, strip download=1
  if (url.includes("vercel-storage.com")) {
    try {
      const u = new URL(url);
      if (u.searchParams.has("download")) {
        u.searchParams.delete("download");
        url = u.toString();
      }
    } catch {
      // ignore
    }
  }

  return url;
};

export const isImageFile = (rawUrl) => {
  if (!rawUrl) return false;
  const clean = String(rawUrl).toLowerCase().split("?")[0];
  return (
    clean.startsWith("data:image") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".svg")
  );
};

export const isEmbedVideo = (rawUrl) => {
  if (!rawUrl) return false;
  const url = String(rawUrl).toLowerCase();
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("drive.google.com")
  );
};

export const getEmbedUrl = (rawUrl) => {
  if (!rawUrl) return "";
  const url = String(rawUrl).trim();
  if (url.includes("youtube.com/watch")) {
    try {
      const v = new URL(url).searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
    } catch {
      // ignore
    }
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
  }
  if (url.includes("drive.google.com/file/d/")) {
    return url.replace(/\/view.*$/, "/preview").replace(/\/edit.*$/, "/preview");
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return url;
};
