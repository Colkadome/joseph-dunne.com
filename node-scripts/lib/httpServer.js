/*
  httpServer.js

  Function that creates a simple http server for serving files.
*/

// Npm.
const http = require('http');
const fs = require('fs');
const path = require('path');

// Lib.
const getMimeTypeFromExtension = require('./getMimeTypeFromExtension');

// Main export.
module.exports = function (rootPath, port = 8000) {
  return http.createServer(function (req, res) {

    // Must be GET or HEAD request.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {});
      res.end();
    }

    // Parse URL.
    const url = new URL(`http://localhost:${port}${req.url}`);

    // If path has no extension, assume its a directory.
    // Pretty dumb.
    let filename = url.pathname;
    if (filename.endsWith('/')) {
      filename += 'index.html';
    }

    // Check for absolute path.
    if (filename.startsWith('/')) {
      filename = filename.substring(1);
    }
    filename = `${rootPath}/${filename}`;

    // Determine content-type for file.
    const contentType = getMimeTypeFromExtension(filename);

    // Try and read file.
    fs.readFile(filename, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(500);
          res.end();
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(content) });
        if (req.method === 'GET') {
          res.end(content, 'utf-8');
        } else {
          res.end();
        }
      }
    });

  }).listen(port);
};
