const admin = require('../config/firebase');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.createListing = async (req, res) => {
  const { formData } = req.body;
  const userId = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};
    
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
        name: formData.contactName || userData.displayName,
        phone: formData.contactPhone,
        email: formData.contactEmail || userData.email,
        photoURL: userData.photoURL || null,
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
    };

    console.log("Listing data to be saved:", listingData);
    await listingRef.set(listingData);
    res.status(201).json({ 
      success: true, 
      message: "Listing created successfully",
      listingId: listingRef.id
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ success: false, error: error.message });
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
        error: "Listing not found" 
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