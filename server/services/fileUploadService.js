const multer = require('multer');
console.log('Initializing file upload service...');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit to mirror frontend hint
  }
});

console.log('FileUploadService initialized.');

module.exports = upload;
