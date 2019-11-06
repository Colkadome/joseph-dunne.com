
const less = require('less');
const fs = require('fs').promises;

async function buildPath(path) {

  const stats = await fs.lstat(path);

  if (stats.isDirectory()) {

    const files = [];

    for (let file of files) {
      buildPath(file);
    }

  } else {



  }
}

buildPath('./src');
