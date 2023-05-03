const fs = require('fs');
const readline = require('readline');
const path = require('path');

const currDir = path.join(__dirname, 'text.txt');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

fs.writeFile(currDir, '', err => {
  if (err) console.log(err);
});

process.stdout.write('Hi! Write some data:\n');

rl.on('line', line => {
  if (line.toLowerCase() === 'exit') return rl.close();

  fs.appendFile(currDir, `${ line }\n`, err => {
    if (err) process.stdout.write(err);
  });
});

rl.once('close', () => process.stdout.write('Success!'));