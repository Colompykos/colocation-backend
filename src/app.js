const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const authMiddleware = require("./middleware/auth");
const admin = require("./config/firebase");
const { getFirestore } = require("firebase-admin/firestore");
const app = express();

const db = getFirestore();

// Middleware setup
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Routes setup
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/LoggedIn", authMiddleware, (req, res) => {
  res.send(`Hello ${req.user.uid}`);
});

app.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    res.status(201).send(userRecord);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.post("/api/upload/profile", upload.single("photo"), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const photoURL = `/uploads/profiles/${file.filename}`;
    res.json({
      success: true,
      photoURL: photoURL,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/profile", authMiddleware, async (req, res) => {
  const { profile } = req.body;
  const userId = req.user.uid;

  try {
    console.log("Received profile data:", profile);
    const userRef = db.collection("users").doc(userId);

    const userData = {
      photoURL: profile.photoURL,
      budget: parseFloat(profile.budget),
      location: profile.location,
      housingType: profile.housingType,
      description: profile.description,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/listings", authMiddleware, async (req, res) => {
  const { formData } = req.body;
  const userId = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    // console.log('Received form data:', formData);
    const listingRef = db.collection("listings").doc();
    const listingData = {
      // Location
      location: {
        street: formData.street,
        postalCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
      },

      // Housing
      housing: {
        totalRoommates: parseInt(formData.totalRoommates),
        bathrooms: parseInt(formData.bathrooms),
        privateArea: parseFloat(formData.privateArea),
      },

      // Details
      details: {
        propertyType: formData.propertyType,
        totalArea: parseFloat(formData.totalArea),
        rooms: parseInt(formData.rooms),
        floor: formData.floor ? parseInt(formData.floor) : null,
        furnished: formData.furnished,
        availableDate: formData.availableDate,
        rent: parseFloat(formData.rent),
        title: formData.title,
        description: formData.description,
      },

      // Photos
      photos: formData.photos,

      // Services
      services: formData.services,

      // Contact
      contact: {
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail,
      },

      // Metadata
      metadata: {
        userId: userId,
        userPhotoURL: userData?.photoURL || null,
        userName: userData.displayName || null,
        userEmail: userData.email || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      contact: {
        name: formData.contactName || userData.displayName,
        phone: formData.contactPhone,
        email: formData.contactEmail || userData.email,
        photoURL: userData.photoURL || null,
      },
    };

    console.log("Listing data to be saved:", listingData);
    await listingRef.set(listingData);
    res
      .status(201)
      .json({ success: true, message: "Listing created successfully" });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/listings", async (req, res) => {
  try {
    const listingsSnapshot = await db.collection("listings").get();
    const listings = listingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/admin/users", authMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.uid))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { users: authUsers } = await admin.auth().listUsers();

    const usersSnapshot = await db.collection("users").get();
    const firestoreUsers = {};
    usersSnapshot.docs.forEach(doc => {
      firestoreUsers[doc.id] = doc.data();
    });

    const users = await Promise.all(authUsers.map(async (authUser) => {
      const firestoreData = firestoreUsers[authUser.uid] || {};
      const providerData = authUser.providerData[0] || {};

      if (!firestoreUsers[authUser.uid]) {
        const userData = {
          email: authUser.email || null,
          displayName: authUser.displayName || null,
          photoURL: authUser.photoURL || null,
          status: "pending",
          isVerified: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          provider: providerData.providerId || "password"
        };

        Object.keys(userData).forEach(key => 
          userData[key] === undefined && delete userData[key]
        );

        await db.collection("users").doc(authUser.uid).set(userData);
        firestoreData = userData;
      }

      const userData = {
        id: authUser.uid,
        email: authUser.email || null,
        displayName: authUser.displayName || authUser.email || null,
        photoURL: firestoreData.photoURL || authUser.photoURL || null,
        emailVerified: authUser.emailVerified || false,
        disabled: authUser.disabled || false,
        lastSignInTime: authUser.metadata.lastSignInTime || null,
        creationTime: authUser.metadata.creationTime || null,
        provider: providerData.providerId || "password",
        isAdmin: firestoreData.isAdmin || false,
        isVerified: firestoreData.isVerified || false,
        status: firestoreData.status || "pending",
        studentCardURL: firestoreData.studentCardURL || null
      };

      Object.keys(userData).forEach(key => 
        userData[key] === undefined && delete userData[key]
      );

      return userData;
    }));

    res.json({ 
      success: true, 
      users,
      total: users.length,
      stats: {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        blocked: users.filter(u => u.status === 'blocked').length,
        providers: {
          password: users.filter(u => u.provider === 'password').length,
          google: users.filter(u => u.provider === 'google.com').length,
          facebook: users.filter(u => u.provider === 'facebook.com').length
        }
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/admin/create", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    await db.collection("users").doc(userRecord.uid).set({
      email,
      isAdmin: true,
      isVerified: true,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete("/api/admin/users/:userId/auth", authMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.uid))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId } = req.params;

    try {
      await admin.auth().deleteUser(userId);
      res.json({ 
        success: true, 
        message: "Compte utilisateur supprimé avec succès" 
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.json({ 
          success: true, 
          message: "Compte utilisateur déjà supprimé" 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error deleting user auth:", error);
    res.status(500).json({ 
      error: error.message || "Erreur lors de la suppression" 
    });
  }
});

const isAdmin = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists && userDoc.data().isAdmin === true;
};

app.get("/api/auth/check-status", authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const userData = userDoc.data();

    if (userData?.status === "blocked") {
      return res.status(403).json({
        error: "Account blocked",
        code: "account-blocked",
      });
    }

    res.json({ status: userData?.status || "active" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/check", authMiddleware, async (req, res) => {
  try {
    const adminStatus = await isAdmin(req.user.uid);
    res.json({ isAdmin: adminStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users/:userId/toggle-block", authMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.uid))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { userId } = req.params;
    const { blocked } = req.body;

    await db.collection("users").doc(userId).update({
      status: blocked ? "blocked" : "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.auth().updateUser(userId, {
      disabled: blocked
    });

    if (blocked) {
      await admin.auth().revokeRefreshTokens(userId);
    }

    res.json({ 
      success: true,
      blocked,
      message: blocked ? "Utilisateur bloqué et déconnecté" : "Utilisateur débloqué"
    });
  } catch (error) {
    console.error("Error toggling user block status:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/admin/users/:userId/verify",
  authMiddleware,
  async (req, res) => {
    try {
      if (!(await isAdmin(req.user.uid))) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { userId } = req.params;

      await db.collection("users").doc(userId).update({
        status: "active",
        isVerified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
