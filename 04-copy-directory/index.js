const { copyFile, mkdir } = require('fs/promises');
const { join } = require('path');
const fs = require('fs');

const TARGET_FOLDER_PATH = join(__dirname, 'files');
const COPY_DIR_PATH = join(__dirname, 'files-copy');

const createDirectory = async () => {
  return await mkdir(COPY_DIR_PATH, { recursive: true });
};

createDirectory()
  .then(
    () => {
      fs.readdir(TARGET_FOLDER_PATH, (err, files) => {
        if (err) console.log(err);

        files.forEach(file => {
          const filePath = join(TARGET_FOLDER_PATH, file);
          const destinationPath = join(COPY_DIR_PATH, file);

          copyFile(filePath, destinationPath);
        });
      });
    });
