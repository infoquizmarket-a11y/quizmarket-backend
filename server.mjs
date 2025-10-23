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
    console.error("❌ Failed to fetch Cloudinary resources:", error);
    res.status(500).json({ error: "Failed to load samples", details: error });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});