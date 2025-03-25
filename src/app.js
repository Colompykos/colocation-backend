const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const listingRoutes = require("./routes/listingRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const authMiddleware = require("./middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.get("/", (req, res) => {
  res.send("Colocation API is running");
});

// Montage des routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes); // Assurez-vous que cette ligne est présente
app.use("/api/favorites", favoriteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

module.exports = app;