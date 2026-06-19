import multer from "multer";

const storage = multer.memoryStorage();

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single("resume");

export const uploadStudentsImport = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const allowedExtensions = /\.(csv|xlsx|xls|docx|txt)$/i;

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.test(file.originalname)
    ) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Only CSV, Excel (.xlsx/.xls), DOCX, and TXT files are allowed.",
      ),
      false,
    );
  },
}).single("file");
