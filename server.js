import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name:"dozaj1xzr",
  api_key:"591753745942397",
  api_secret:"TmHC4vNNBevm77B9KOfbdPApFmU",
});
const app = express();
const PORT = process.env.PORT;
// -------------------- CORS Setup --------------------
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://quizmarket.netlify.app",               // ✅ your main website
        "https://quizmarket-frontend.netlify.app",      // ✅ your React frontend
        "https://main--quizmarket.netlify.app",         // ✅ Netlify preview (optional)
        "https://main--quizmarket-frontend.netlify.app" // ✅ Netlify preview (optional)
      ]
    : ["http://localhost:3000"];


app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌐 Incoming origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true); // ✅ allow curl, Postman, Netlify, and missing origins
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// -------------------- Firebase Admin Setup --------------------
let serviceAccount;

try {
  if (fs.existsSync("./serviceAccountKey.json")) {
    // Local development
    serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
    console.log("✅ Using local serviceAccountKey.json");
  } else if (fs.existsSync("/etc/secrets/serviceAccountKey.json")) {
    // Render Secret File
    serviceAccount = JSON.parse(fs.readFileSync("/etc/secrets/serviceAccountKey.json", "utf8"));
    console.log("✅ Using Render secret file");
  } else {
    throw new Error("❌ No serviceAccountKey.json found");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error("Firebase Admin initialization error:", err);
}
// -------------------- PDF Upload Setup --------------------
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
   cb(null, file.originalname);
  },
});

const upload = multer({ storage });


// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));
// -------------------- Routes --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend is connected and working!" });
});

// ➡️ Add this root route to fix "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
// -------------------- PDF Upload Routes --------------------
const memoryUpload = multer(); // in-memory upload

app.post("/upload", memoryUpload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const uploadStream = cloudinary.v2.uploader.upload_stream(
    {
      resource_type: "raw", // for PDFs
      public_id: req.file.originalname.replace(".pdf", ""), // optional: remove .pdf
      folder: "quizmarket_pdfs", // optional folder name
    },
    (error, result) => {
      if (error) return res.status(500).json({ error: "Upload failed", details: error });
      res.json({ message: "PDF uploaded successfully", url: result.secure_url });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});
app.get("/list", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to list files" });
    res.json({ files: files.map(name => ({ name })) });
  });
});
app.post("/delete", express.json(), (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: "No filename provided" });

  const filePath = path.join("uploads", filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete file" });
    res.json({ message: "File deleted successfully" });
  });
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});