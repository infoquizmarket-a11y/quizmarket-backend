import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Cloudinary config
cloudinary.config({
  cloud_name:process.env."dozaj1xzr",       // 🔁 Replace with your Cloudinary cloud name
  api_key:process.env."591753745942397",             // 🔁 Replace with your Cloudinary API key
  api_secret:process.env."TmHC4vNNBevm77B9KOfbdPApFmU",       // 🔁 Replace with your Cloudinary API secret
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

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});