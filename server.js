import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- CORS Setup --------------------
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://your-frontend.netlify.app"] // 🔴 replace with your actual Netlify URL
    : ["http://localhost:3000"];            // local React dev server

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow curl/postman
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
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

// -------------------- Routes --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend is connected and working!" });
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});