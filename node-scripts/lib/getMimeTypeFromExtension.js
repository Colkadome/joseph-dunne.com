/*
  getMimeTypeFromExtension.js
*/

const path = require('path');

// Mime types.
const MIME_TYPES = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
};

// Main export.
module.exports = function (filename) {
  if (typeof filename === 'string') {
    const ext = path.extname(filename).substring(1);
    const type = ext ? MIME_TYPES[ext] : '';
    if (type) {
      return type;
    }
  }
  return 'application/octet-stream';
};
