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

    // Check for index file.
    let path = url.pathname;
    if (path.endsWith('/')) {
      path += 'index.html';
    }
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    path = `${rootPath}/${path}`;

    // Determine content-type for file.
    const contentType = getMimeTypeFromExtension(path);

    // Try and read file.
    fs.readFile(path, (err, content) => {
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
