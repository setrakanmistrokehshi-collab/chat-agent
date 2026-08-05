import express from "express";
import { protect } from "../middleware/auth.js";
import { generatePdf, generateDocx, generateImageFile } from "../controllers/fileController.js";

const router = express.Router();

router.use(protect);

router.post("/generate/pdf", generatePdf);
router.post("/generate/docx", generateDocx);
router.post("/generate/image", generateImageFile);

export default router;
