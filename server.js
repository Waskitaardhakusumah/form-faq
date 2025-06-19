const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'upload'); // folder upload
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Endpoint untuk upload file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  // Kirim link file yang di-upload
  const fileUrl = `/upload/${req.file.filename}`;
  res.json({ status: 'success', url: fileUrl });
});

// Static serve folder upload
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// ...kode server.js lain...