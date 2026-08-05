import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";

/**
 * Generates a PDF from plain text and returns it as a Buffer.
 */
export const generatePdfBuffer = (title, content) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(content, { align: "left" });

    doc.end();
  });
};

/**
 * Generates a DOCX from plain text and returns it as a Buffer.
 */
export const generateDocxBuffer = async (title, content) => {
  const paragraphs = content
    .split("\n")
    .map((line) => new Paragraph({ children: [new TextRun(line)] }));

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 32 })],
          }),
          new Paragraph({ children: [new TextRun("")] }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};
