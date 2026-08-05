import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { STORAGE_TYPE } from "../config/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", process.env.LOCAL_UPLOAD_DIR || "uploads");

/**
 * Saves a Buffer (e.g. an AI-generated PDF/DOCX/image) to whichever storage
 * backend is active, and returns { url, key, filename } for the frontend.
 */
export const saveGeneratedFile = async (buffer, filename, mimeType) => {
  if (STORAGE_TYPE === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const key = `generated/${Date.now()}-${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { url, key, filename };
  }

  // Local disk
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const diskName = `${Date.now()}-${filename}`;
  fs.writeFileSync(path.join(uploadDir, diskName), buffer);

  return { url: `/uploads/${diskName}`, key: diskName, filename };
};
