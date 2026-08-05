import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { parse as parseCsv } from "csv-parse/sync";

const MAX_CONTEXT_CHARS = 12000; // keep AI context reasonably sized

const truncate = (text) =>
  text.length > MAX_CONTEXT_CHARS
    ? text.slice(0, MAX_CONTEXT_CHARS) + "\n\n[...truncated...]"
    : text;

/**
 * Extracts plain text from a file buffer based on its extension.
 * Works whether the buffer came from local disk or was downloaded from S3.
 */
export const extractTextFromFile = async (buffer, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  switch (ext) {
    case ".txt":
    case ".md":
      return truncate(buffer.toString("utf-8"));

    case ".pdf": {
      const data = await pdfParse(buffer);
      return truncate(data.text);
    }

    case ".docx": {
      const result = await mammoth.extractRawText({ buffer });
      return truncate(result.value);
    }

    case ".csv": {
      const records = parseCsv(buffer, { columns: false, skip_empty_lines: true });
      const rows = records.slice(0, 200); // cap rows for context size
      const csvText = rows.map((r) => r.join(", ")).join("\n");
      return truncate(csvText);
    }

    default:
      throw new Error(`Unsupported file type for text extraction: ${ext}`);
  }
};

/**
 * Reads a file buffer from either local disk or a remote (S3) URL.
 */
export const readFileBuffer = async (fileMeta) => {
  if (fileMeta.location) {
    // S3 file: fetch it
    const response = await fetch(fileMeta.location);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  // Local disk file
  return fs.readFileSync(fileMeta.path);
};
