const { stat } = require('fs');
const { readdir } = require('fs/promises');
const path = require('path');

const SECRET_FOLDER_PATH = `${ __dirname }/secret-folder`;

const getFileSize = filePath => {
  return new Promise(resolve => {
    stat(filePath, (err, stats) => {
      if (err) process.stdout.write(err);
      resolve(stats.size);
    });
  });
};

const getFileFormat = file => path.extname(file.name).slice(1);
const getFileName = file => path.basename(file.name, path.extname(file.name));

readdir(SECRET_FOLDER_PATH, { withFileTypes: true })
  .then(
    files =>
      files
        .forEach(
          file => {
            if (!file.isFile()) return;

            const currFilePath = `${ SECRET_FOLDER_PATH }/${ file.name }`;
            getFileSize(currFilePath)
              .then(
                size => {
                  process.stdout.write(
                    `${ getFileName(file) } - ${ getFileFormat(file) } - ${ size / 1000 }kb\n`
                  );
                });
          }
        )
  );