const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.createListing = async (req, res) => {
  try {
    // Accepte à la fois listing ou formData
    const listing = req.body.listing || req.body.formData;
    const userId = req.user.uid;

    // Vérifier que l'utilisateur existe et est vérifié
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        error: "Utilisateur non trouvé" 
      });
    }
    
    const userData = userDoc.data();
    
    if (!userData.isVerified) {
      return res.status(403).json({ 
        success: false, 
        error: "Votre compte doit être vérifié pour publier une annonce" 
      });
    }

    // S'assurer que le statut est "pending" pour les nouvelles annonces
    const listingWithStatus = {
      ...listing,
      status: "pending",
      isVisible: true,
      metadata: {
        ...(listing.metadata || {}),
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    };

    // Créer l'annonce
    const listingRef = db.collection("listings").doc();
    await listingRef.set(listingWithStatus);
    
    res.status(201).json({ 
      success: true, 
      message: "Annonce créée avec succès",
      listingId: listingRef.id 
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    const listingsSnapshot = await db.collection("listings").get();
    const listings = listingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({ 
      success: true, 
      listings 
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.getListingById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const listingDoc = await db.collection("listings").doc(id).get();
    
    if (!listingDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: "Annonce introuvable" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      listing: {
        id: listingDoc.id,
        ...listingDoc.data()
      }
    });
  } catch (error) {
    console.error(`Error fetching listing ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating listing with ID:", id);
    console.log("Request body:", req.body);

    // Accepte à la fois listing ou formData
    const listing = req.body.listing || req.body.formData;
    const userId = req.user.uid;

    if (!listing) {
      return res.status(400).json({ 
        success: false, 
        error: "Données d'annonce manquantes" 
      });
    }

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const listingRef = db.collection("listings").doc(id);
    const listingDoc = await listingRef.get();
    
    if (!listingDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: "Annonce introuvable" 
      });
    }
    
    const listingData = listingDoc.data();
    
    if (listingData.metadata?.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Vous n'êtes pas autorisé à modifier cette annonce" 
      });
    }

    // Préserver le statut actuel et les métadonnées mais mettre à jour updatedAt
    const updatedListing = {
      ...listing,
      status: listingData.status, // Conserver le statut actuel
      metadata: {
        ...listingData.metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    };
    
    await listingRef.update(updatedListing);
    
    res.status(200).json({ 
      success: true, 
      message: "Annonce mise à jour avec succès",
      listingId: id
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // Vérifier si l'utilisateur est un admin
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const isAdmin = userDoc.exists && userDoc.data().isAdmin;

    // Vérifier que l'annonce existe
    const listingRef = db.collection("listings").doc(id);
    const listingDoc = await listingRef.get();
    
    if (!listingDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: "Annonce introuvable" 
      });
    }
    
    const listingData = listingDoc.data();
    
    // Vérifier que l'utilisateur a le droit de supprimer (propriétaire ou admin)
    if (listingData.metadata?.userId !== userId && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: "Vous n'êtes pas autorisé à supprimer cette annonce" 
      });
    }

    // Supprimer l'annonce
    await listingRef.delete();
    
    res.status(200).json({ 
      success: true, 
      message: "Annonce supprimée avec succès"
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};