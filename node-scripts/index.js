
const fs = require('fs');
const dots = require('dot');

async function getAllConfigFiles(dirPath) {

  let results = [];
  const dir = await fs.promises.opendir(dirPath);

  for await (const dirent of dir) {

    const name = dirent.name;
    const path = `${dirPath}/${name}`;

    if (dirent.isDirectory()) {

      results = results.concat(await getAllConfigFiles(path));

    } else if (name === 'index.json') {

      const data = JSON.parse(await fs.promises.readFile(path, 'utf8'));
      data.path = dirPath;

      results = results.concat([data]);

    }
  }

  return results;
}

async function main() {

  const paths = await getAllConfigFiles('./src');

  console.log(paths);

}

main();
