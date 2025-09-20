const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Creates a zip archive from a list of image paths.
 * @param {string[]} imagePaths - An array of absolute paths to the images.
 * @param {string} outputFileName - The path for the output zip file.
 * @returns {Promise<string>} A promise that resolves with the path to the created zip file.
 */
const createZipArchive = (imagePaths, outputFileName) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFileName);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve(outputFileName);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    imagePaths.forEach((imagePath, index) => {
      archive.file(imagePath, { name: `image_${index + 1}.png` });
    });

    archive.finalize();
  });
};

/**
 * Creates a zip archive from a directory.
 * @param {string} sourceDir - The source directory to zip.
 * @param {string} outPath - The path for the output zip file.
 * @returns {Promise<void>}
 */
const createZip = (sourceDir, outPath) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};


module.exports = {
  createZipArchive,
  createZip,
};