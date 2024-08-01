const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, 'storage.json');

function readData() {
  try {
    const data = fs.readFileSync(storagePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
}

function getField(field) {
    const data = readData();
    return data[field];
  }

module.exports = {
  readData,
  writeData,
  getField
};
