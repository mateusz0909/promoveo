const multer = require('multer');
const tmpService = require('./tmpService');

console.log('Initializing file upload service...');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = tmpService.getTmpDirPath();
    tmpService.ensureTmpDirSync();
    console.log(`FileUploadService: setting destination to ${dest}`);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const filename = file.originalname;
    console.log(`FileUploadService: setting filename to ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

console.log('FileUploadService initialized.');

module.exports = upload;
