const { readdir, createReadStream, writeFile } = require('fs');
const { join, extname } = require('path');

const STYLES_PATH = join(__dirname, 'styles');
const DIST_PATH = join(__dirname, 'project-dist', 'bundle.css');
const readStreamQueue = [];

const getFileFormat = file => extname(file.name);

const readFileContent = filePath => {
  const read = createReadStream(filePath, 'utf8');

  const readStreamPromise = new Promise(resolve => {
    read.on('data', data => {
      resolve(data);
    });
  });

  readStreamQueue.push(readStreamPromise);
};

readdir(STYLES_PATH, { withFileTypes: true }, (err, files) => {
  if (err) console.log(err);

  files.map(file => {
    if (!file.isFile() || getFileFormat(file) !== '.css') return;

    const currFilePath = join(STYLES_PATH, file.name);

    readFileContent(currFilePath);
  });


  Promise.all(readStreamQueue)
    .then(
      val => {
        const styles = val.join('\n');

        writeFile(DIST_PATH, styles, () => {
        });
      }
    );
});
