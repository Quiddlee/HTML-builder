const fs = require('fs');

const read = fs.createReadStream('01-read-file/text.txt', 'utf8');

read.on('data', data => {
  process.stdout.write(data);
});