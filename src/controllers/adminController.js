const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');
const { isAdmin } = require('../utils/adminUtils');

const db = getFirestore();

exports.checkAdmin = async (req, res) => {
  try {
    const adminStatus = await isAdmin(req.user.uid);
    res.json({ isAdmin: adminStatus });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.getAllUsers = async (req, res) => {
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
      let firestoreData = firestoreUsers[authUser.uid] || {};
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.deleteUserAuth = async (req, res) => {
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
};

exports.toggleBlockUser = async (req, res) => {
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
};

exports.verifyUser = async (req, res) => {
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
};
