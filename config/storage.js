import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const allowed = [".txt", ".pdf", ".docx", ".csv", ".md"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`), false);
  }
};

let upload;

if (STORAGE_TYPE === "s3") {
  // Lazy-load AWS deps only when needed so local-only setups don't require them
  const { S3Client } = await import("@aws-sdk/client-s3");
  const multerS3 = (await import("multer-s3")).default;

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        cb(null, `uploads/${uniqueName}`);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
} else {
  // Local disk storage
  const uploadDir = path.join(__dirname, "..", process.env.LOCAL_UPLOAD_DIR || "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

/**
 * Returns a URL/path the frontend can use to fetch/download the file,
 * regardless of which storage backend is active.
 */
export const getFileUrl = (file) => {
  if (STORAGE_TYPE === "s3") {
    return file.location; // multer-s3 attaches the public URL here
  }
  return `/uploads/${file.filename}`;
};

export const getFileKey = (file) => {
  return STORAGE_TYPE === "s3" ? file.key : file.filename;
};

export { STORAGE_TYPE };
export default upload;
