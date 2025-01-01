const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const admin = require('./config/firebase');
const app = express();

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

module.exports = app;