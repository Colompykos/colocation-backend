const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.isAdmin = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists && userDoc.data().isAdmin === true;
};