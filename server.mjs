import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Cloudinary config (paste your actual credentials or use environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dozaj1xzr",
  api_key: process.env.CLOUDINARY_API_KEY || "591753745942397",
  api_secret: process.env.CLOUDINARY_API_SECRET || "TmHC4vNNBevm77B9KOfbdPApFmU",
});


// ✅ Enable CORS for all origins
app.use(cors());
app.use(express.json());


// ✅ Add this root route here
app.get("/", (req, res) => {
  res.send("✅ QuizMarket backend is live!");
});


// ✅ Health check for Render
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ✅ List route for sample PDFs
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

    res.setHeader("Cache-Control", "no-store");
    res.json({ samples });
  } catch (error) {
    console.error("❌ Cloudinary error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      response: error?.response?.data,
    });

    res.status(500).json({
      error: "Failed to load samples",
      details: {
        message: error?.message,
        response: error?.response?.data,
      },
    });
  }
});
// ✅ Upload route — paste this here
const upload = multer();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 Incoming file:", req.file);

    if (!req.file) {
      console.error("❌ No file received in upload");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "quizmarket_pdfs",
        public_id: req.body.title || undefined,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Upload error:", error);
          return res.status(500).json({ error: "Upload failed", details: error });
        }
        res.status(200).json({ success: true, url: result.secure_url });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error("❌ Unexpected upload error:", err);
    res.status(500).json({ error: "Unexpected error", details: err });
  }
});

// ✅ Enable JSON parsing for all other routes
app.use(express.json());


// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});