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

app.post('/api/listings', authMiddleware, async (req, res) => {
  const { formData } = req.body;
  const userId = req.user.uid;

  try {
    console.log('Received form data:', formData);
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    };

    console.log('Listing data to be saved:', listingData);
    await listingRef.set(listingData);
    res.status(201).json({ success: true, message: 'Listing created successfully' });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;