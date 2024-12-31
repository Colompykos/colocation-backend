const admin = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log(decodedToken);
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
};

module.exports = authMiddleware;