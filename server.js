const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: "dozaj1xzr",       // 🔁 Replace with your Cloudinary cloud name
  api_key: "591753745942397",             // 🔁 Replace with your Cloudinary API key
  api_secret: "TmHC4vNNBevm77B9KOfbdPApFmU",       // 🔁 Replace with your Cloudinary API secret
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
      resource_type: "raw", // PDFs are treated as raw files
      public_id: req.file.originalname.replace(".pdf", ""), // optional: remove .pdf
      folder: "quizmarket_pdfs", // optional folder name
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