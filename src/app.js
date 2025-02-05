const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const admin = require('./config/firebase');
const { getFirestore } = require('firebase-admin/firestore');
const app = express();

const db = getFirestore();

// Middleware setup
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Routes setup
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/LoggedIn', authMiddleware, (req, res) => {
  res.send(`Hello ${req.user.uid}`);
});

app.post('/signup', async (req, res) => {
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
    cb(null, 'public/uploads/profiles/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.post('/api/upload/profile', upload.single('photo'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const photoURL = `/uploads/profiles/${file.filename}`;
    res.json({
      success: true,
      photoURL: photoURL
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/profile', authMiddleware, async (req, res) => {
  const { profile } = req.body;
  const userId = req.user.uid;

  try {
    console.log('Received profile data:', profile);
    const userRef = db.collection('users').doc(userId);
    
    const userData = {
      photoURL: profile.photoURL,
      budget: parseFloat(profile.budget),
      location: profile.location,
      housingType: profile.housingType,
      description: profile.description,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData, { merge: true });
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/listings', authMiddleware, async (req, res) => {
  const { formData } = req.body;
  const userId = req.user.uid;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};
    // console.log('Received form data:', formData);
    const listingRef = db.collection('listings').doc();
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
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      contact: {
        name: formData.contactName || userData.displayName,
        phone: formData.contactPhone,
        email: formData.contactEmail || userData.email,
        photoURL: userData.photoURL || null
      },
    };

    console.log('Listing data to be saved:', listingData);
    await listingRef.set(listingData);
    res.status(201).json({ success: true, message: 'Listing created successfully' });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const listingsSnapshot = await db.collection('listings').get();
    const listings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;