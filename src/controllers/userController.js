const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');
const { isAdmin } = require('../utils/adminUtils');

const db = getFirestore();

exports.signup = async (req, res) => {
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
};

exports.createAdmin = async (req, res) => {
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
};

exports.checkAuthStatus = async (req, res) => {
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
};

exports.updateProfile = async (req, res) => {
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
};
