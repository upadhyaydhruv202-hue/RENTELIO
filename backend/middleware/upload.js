const path = require('path');
const multer = require('multer');
const { ensureUploadDir, UPLOAD_DIR } = require('../services/productImage');

ensureUploadDir();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
    cb(null, `upload-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeOk = ALLOWED_MIME.has(String(file.mimetype || '').toLowerCase());
    const extOk = ALLOWED_EXT.has(ext);
    if (!mimeOk || !extOk) {
      return cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  },
});

const uploadProductImage = upload.single('image');

module.exports = { uploadProductImage, ALLOWED_MIME, ALLOWED_EXT };
