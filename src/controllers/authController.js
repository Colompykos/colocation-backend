const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.signup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: `${firstName} ${lastName}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    res.status(201).send(userRecord);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.loggedIn = (req, res) => {
  res.send(`Hello ${req.user.uid}`);
};

exports.checkStatus = async (req, res) => {
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