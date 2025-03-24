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

app.get("/LoggedIn", authMiddleware, (req, res) => {
  res.send(`Hello ${req.user.uid}`);
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

module.exports = app;