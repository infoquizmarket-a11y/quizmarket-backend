import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();
const PORT = process.env.PORT;

console.log("🔐 Cloudinary config loaded");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Multer memory storage
const memoryUpload = multer({ storage: multer.memoryStorage() });

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ QuizMarket backend is running");
});

// ✅ Upload route
app.post("/upload", memoryUpload.single("pdf"), (req, res) => {
  if (!req.file) {
    console.warn("⚠️ No file received");
    return res.status(400).json({ error: "No file uploaded" });
  }
console.log("📥 Received file:", req.file?.originalname);
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "raw",
      public_id: req.file.originalname.replace(".pdf", ""),
      folder: "quizmarket_pdfs",
    },
    (error, result) => {
      if (error) {
        console.error("❌ Cloudinary upload failed:", error);
        return res.status(500).json({ error: "Upload failed", details: error });
      }

      console.log("✅ Cloudinary upload success:", result.secure_url);
      res.json({ message: "PDF uploaded successfully", url: result.secure_url });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});
process.on("uncaughtException", err => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("💥 Unhandled Rejection:", err);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});