const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
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

module.exports = app;