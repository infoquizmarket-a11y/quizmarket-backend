import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all origins
app.use(cors());

// ✅ Handle preflight requests explicitly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or your Netlify domain
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // ✅ Respond to preflight
  }
  next();
});

// ✅ Optional: parse JSON bodies
app.use(express.json());

// ✅ /list route
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