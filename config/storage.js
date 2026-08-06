import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024;

// Vercel / AWS Lambda = read-only FS except /tmp
const isServerless =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.FUNCTION_NAME;

const sanitizeFilename = (name) => {
  const baseName = path.basename(name || "");
  const cleaned = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "file";
};

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
let uploadDir = null;

if (STORAGE_TYPE === "s3") {
  // Lazy-load AWS deps only when needed
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
        const safeName = sanitizeFilename(file.originalname);
        const uniqueName = `${Date.now()}-${safeName}`;
        cb(null, `uploads/${uniqueName}`);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
} else {
  // Local disk storage
  // On serverless use /tmp (only writable path). Elsewhere use project uploads folder.
  uploadDir = isServerless
    ? path.join("/tmp", process.env.LOCAL_UPLOAD_DIR || "uploads")
    : path.join(__dirname, "..", process.env.LOCAL_UPLOAD_DIR || "uploads");

  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.warn(
      `[storage] Could not create upload dir "${uploadDir}": ${err.message}`,
    );
    // Do not crash the process — uploads will fail later with a clear error
  }

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (!uploadDir || !fs.existsSync(uploadDir)) {
          return cb(new Error("Upload directory is not available"));
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const safeName = sanitizeFilename(file.originalname);
        const uniqueName = `${Date.now()}-${safeName}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

/**
 * Returns a URL/path the frontend can use to fetch/download the file.
 */
export const getFileUrl = (file) => {
  if (STORAGE_TYPE === "s3") {
    return file.location; // multer-s3 public URL
  }
  return `/uploads/${file.filename}`;
};

export const getFileKey = (file) => {
  return STORAGE_TYPE === "s3" ? file.key : file.filename;
};

export const getUploadDir = () => uploadDir;

export { STORAGE_TYPE };
export default upload;