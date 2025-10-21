import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();
const PORT = process.env.PORT;

console.log("🔐 Cloudinary config loaded");
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Missing Cloudinary environment variables");
  process.exit(1); // Optional: fail fast
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Health check route for Render (place this BEFORE multer or any upload logic)
app.get("/health", (req, res) => {
  console.log("🔁 Render health check pinged");
  res.status(200).send("🟢 Health check passed");
});

// ✅ Manual check route (optional)
app.get("/", (req, res) => {
  res.send("✅ QuizMarket backend is running");
});



// ✅ Multer memory storage
const memoryUpload = multer({ storage: multer.memoryStorage() });

// ✅ Upload route
app.post("/upload", memoryUpload.single("pdf"), (req, res) => {
  if (!req.file) {
    console.warn("⚠️ No file received");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("📥 Received file:", req.file.originalname);
  console.log("📦 File buffer size:", req.file.buffer?.length);

  try {
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
  } catch (err) {
    console.error("💥 Streamifier pipe failed:", err);
    return res.status(500).json({ error: "Stream error", details: err });
  }
});

// ✅ Start server
app.get("/list", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "quizmarket_pdfs/",
      resource_type: "raw",
      max_results: 30,
    });

    const samples = result.resources.map(file => ({
      title: file.public_id.replace("quizmarket_pdfs/", ""),
      url: file.secure_url,
    }));

    res.setHeader("Cache-Control", "no-store"); // ✅ Prevent 304
    res.json({ samples });
  } catch (error) {
    console.error("❌ Failed to fetch Cloudinary resources:", error);
    res.status(500).json({ error: "Failed to load samples", details: error });
  }
});

});app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});