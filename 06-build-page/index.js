const { createReadStream, writeFile } = require('fs');
const { readdir, mkdir, copyFile } = require('fs/promises');
const { join, extname } = require('path');
const path = require('path');

const paths = {
  DIST: join(__dirname, 'project-dist'),
  STYLES: join(__dirname, 'styles'),
  COMPONENTS: join(__dirname, 'components'),
  TEMPLATE: join(__dirname, 'template.html'),
  ASSETS: join(__dirname, 'assets'),
};

const components = new Map();
const readQueue = new Set();

const getFileFormat = file => path.extname(file.name);

const createFile = (path, content) => {
  writeFile(path, content, err => {
    if (err) console.log(err);
  });
};

const createDistDir = () => createDirectory(paths.DIST);

const createDirectory = path => mkdir(path, { recursive: true });

const readFile = path => {
  const read = createReadStream(path, 'utf8');

  return new Promise(resolve => {
    read.on('data', data => {
      resolve(data);
    });
  });
};

const mergeStyles = () => {
  const readStreamQueue = new Set();

  const getFileFormat = file => extname(file.name);

  readdir(paths.STYLES, { withFileTypes: true })
    .then((files) => {

      files.map(file => {
        if (!file.isFile() || getFileFormat(file) !== '.css') return;

        const currFilePath = join(paths.STYLES, file.name);

        readStreamQueue.add(readFile(currFilePath));
      });


      Promise.all(readStreamQueue)
        .then(
          val => {
            const styles = val.join('\n');
            createFile(join(paths.DIST, 'style.css'), styles);
          }
        );
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

const fillTemplates = data => {
  const layoutArr = data.split('\n');
  const templates = [];
  let html = data;

  layoutArr.forEach(str => {
    if (!str.match(/{/)) return;
    templates.push(...str.split(' '));
  });

  templates.forEach(tmpl => {
    if (!tmpl.match(/{/)) return;

    const componentName = tmpl.replace(/[{}\n\r\s]/g, '');

    html = html.replace(`{{${ componentName }}}`, components.get(componentName));
  });

  return html;
};

const copyAssetsFolder = () => {
  createDirectory(join(paths.DIST, 'assets'))
    .then(
      () => {
        const recursiveFolderRead = (path, distPath) => {
          readdir(path, { withFileTypes: true })
            .then(
              filesOrDir => {
                filesOrDir.forEach(file => {
                  const filePath = join(path, file.name);
                  const destinationPath = join(join(distPath, file.name));

                  if (file.isFile()) return copyFile(filePath, destinationPath);

                  createDirectory(join(distPath, file.name))
                    .then(recursiveFolderRead.bind(null, filePath, destinationPath));
                });
              });
        };

        recursiveFolderRead(paths.ASSETS, join(paths.DIST, 'assets'));
      });
};

const fillTemplatesAndCreateIndexFile = () => {
  readdir(join(paths.COMPONENTS), { withFileTypes: true })
    .then(
      files => {
        files.forEach(
          file => {
            if (!file.isFile() || getFileFormat(file) !== '.html') return;

            readQueue.add([ file.name, readFile(join(paths.COMPONENTS, file.name)) ]);
          });
      })
    .then(() => {
      storeComponents(readQueue)
        .then(() => {
          readFile(paths.TEMPLATE)
            .then(data => {
              const html = fillTemplates(data);

              createFile(join(paths.DIST, 'index.html'), html);
            });
        });
    });
};

createDistDir()
  .then(() => {
    fillTemplatesAndCreateIndexFile();
    mergeStyles();
    copyAssetsFolder();
  });