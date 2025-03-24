const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.toggleFavorite = async (req, res) => {
  const { listingId } = req.body;
  const userId = req.user.uid;

  try {
    const favoriteRef = db.collection("favorites").doc(`${userId}_${listingId}`);
    const favoriteDoc = await favoriteRef.get();

    if (favoriteDoc.exists) {
      await favoriteRef.delete();
      res.status(200).json({
        success: true,
        isFavorite: false,
        message: "Removed from favorites",
      });
    } else {
      
      await favoriteRef.set({
        userId,
        listingId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).json({
        success: true,
        isFavorite: true,
        message: "Added to favorites",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.checkFavoriteStatus = async (req, res) => {
  const { listingId } = req.params;
  const userId = req.user.uid;

  try {
    const favoriteRef = db.collection("favorites").doc(`${userId}_${listingId}`);
    const favoriteDoc = await favoriteRef.get();

    res.status(200).json({
      success: true,
      isFavorite: favoriteDoc.exists,
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getUserFavorites = async (req, res) => {
  const userId = req.user.uid;

  try {
    const favoritesSnapshot = await db.collection("favorites")
      .where("userId", "==", userId)
      .get();
      
    const favorites = [];
    
    if (!favoritesSnapshot.empty) {
      const listingIds = favoritesSnapshot.docs.map(doc => doc.data().listingId);
      
      const listingsPromises = listingIds.map(id => 
        db.collection("listings").doc(id).get()
      );
      
      const listingDocs = await Promise.all(listingsPromises);
      
      listingDocs.forEach(doc => {
        if (doc.exists) {
          favorites.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
    }
    
    res.status(200).json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};