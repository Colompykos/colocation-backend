const admin = require("../config/firebase");
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    if (userRecord.disabled) {
      return res.status(403).json({ 
        error: 'Account blocked',
        code: 'account-blocked'
      });
    }

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data().status === 'blocked') {
      await admin.auth().revokeRefreshTokens(decodedToken.uid);
      return res.status(403).json({ 
        error: 'Account blocked',
        code: 'account-blocked'
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;