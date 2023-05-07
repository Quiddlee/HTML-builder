const { createReadStream, writeFile } = require('fs');
const { mkdir } = require('fs/promises');
const { join, extname } = require('path');
const { readdir, copyFile } = require('fs/promises');
const path = require('path');


const DIST_PATH = join(__dirname, 'project-dist');
const components = new Map();
const readQueue = new Set();

const getFileFormat = file => path.extname(file.name);
const createFile = (path, content) => {
  writeFile(path, content, err => {
    if (err) console.log(err);
  });
};
const createDirectory = async path => {
  return await mkdir(path, { recursive: true });
};

const readFile = path => {
  const read = createReadStream(path, 'utf8');

  return new Promise(resolve => {
    read.on('data', data => {
      resolve(data);
    });
  });
};

const mergeStyles = () => {
  const STYLES_PATH = join(__dirname, 'styles');
  const readStreamQueue = new Set();

  const getFileFormat = file => extname(file.name);

  readdir(STYLES_PATH, { withFileTypes: true })
    .then((files) => {

      files.map(file => {
        if (!file.isFile() || getFileFormat(file) !== '.css') return;

        const currFilePath = join(STYLES_PATH, file.name);

        readStreamQueue.add(readFile(currFilePath));
      });


      Promise.all(readStreamQueue)
        .then(
          val => {
            const styles = val.join('\n');
            createFile(join(DIST_PATH, 'style.css'), styles);
          }
        );
    });
};

const createDistDir = () => {
  mkdir(DIST_PATH, { recursive: true }, () => {
  });
};

const storeComponents = (readQueue) => {
  return Promise.all(readQueue)
    .then((data) => {
      data.forEach(file => {
        const [ componentName, promise ] = file;

        promise.then((componentInner) => {
          components.set(componentName.slice(0, componentName.indexOf('.')), componentInner);
        });
      });
    });
};

const fillTemplates = (data) => {
  const array = data.split('\n');

  array.forEach(str => {
    if (!str.match(/{/)) return;

    const templateIndex = array.findIndex(elem => elem === str);
    const key = str.replace(/{/g, '').replace(/}/g, '');

    array[templateIndex] = components.get(key.trim());
  });

  return array.join('\n');
};

const copyAssetsFolder = () => {
  createDirectory(join(DIST_PATH, 'assets'))
    .then(
      () => {
        readdir(join(__dirname, 'assets'))
          .then(files => {
            files.forEach(file => {
              const filePath = join(join(__dirname, 'assets'), file);
              const destinationPath = join(join(DIST_PATH, 'assets'), file);

              copyFile(filePath, destinationPath);
            });
          });
      });
};

readdir(join(__dirname, 'components'), { withFileTypes: true })
  .then(
    files => {
      files.forEach(
        file => {
          if (!file.isFile() || getFileFormat(file) !== '.html') return;

          readQueue.add([ file.name, readFile(join(__dirname, 'components', file.name)) ]);
        });
    })
  .then(() => {
    storeComponents(readQueue)
      .then(() => {
        const templatePath = join(__dirname, 'template.html');

        readFile(templatePath)
          .then(data => {
            const html = fillTemplates(data);

            createFile(join(DIST_PATH, 'index.html'), html);
          });
      });
  });


createDistDir();
mergeStyles();
copyAssetsFolder();
