const path = require('path');

exports.uploadProfilePhoto = (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const photoURL = `/uploads/profiles/${file.filename}`;
    res.json({
      success: true,
      photoURL: photoURL,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};