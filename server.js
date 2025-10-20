import express from "express";
import cors from "cors";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";

// Load your Firebase Admin SDK key
// ⚠️ Replace with the correct path if you rename the file
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 uploads

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "quizmarketinfo.firebasestorage.app" // your bucket name
});

const bucket = getStorage().bucket();

// --- Upload Endpoint ---
app.post("/upload", async (req, res) => {
  try {
    const { fileName, fileContentBase64, folder } = req.body;
    if (!fileName || !fileContentBase64 || !folder) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const buffer = Buffer.from(fileContentBase64, "base64");
    const file = bucket.file(`${folder}/${fileName}`);

    await file.save(buffer, {
      metadata: { contentType: "application/pdf" },
      resumable: false
    });

    // Generate a signed URL valid until 2030
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030"
    });

    res.json({ success: true, url });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Delete Endpoint ---
app.delete("/delete", async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: "Missing filePath" });
    }

    const file = bucket.file(filePath);
    await file.delete();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));