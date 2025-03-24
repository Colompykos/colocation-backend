const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

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

exports.getProfile = async (req, res) => {
  const userId = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    const userData = userDoc.data();
    res.status(200).json({
      success: true,
      profile: userData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};