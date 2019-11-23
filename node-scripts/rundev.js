
const fs = require('fs');
const less = require('less');
const babel = require('@babel/core');

/**
 * Ensures that a directory exists, given a path.
 * The path is assumed to contain the file.
 * @arg {String} directory to ensure.
 */
async function ensureDirectoryForFile(path) {

  const dirs = path.split('/');
  dirs.pop();

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs.slice(0, i + 1).join('/');
    try {
      const entry = await fs.promises.lstat(dir);
      if (!entry.isDirectory()) {
        throw new Error('Not Directory');
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.promises.mkdir(dir);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Function to get all files in a folder, recursively.
 * @arg {String} rootPath - path to folder.
 * @returns {Array} array of paths relative to 'rootPath'.
 */
async function getListOfFiles(rootPath, _path, _fileList) {
  _fileList = _fileList || [];

  const dirPath = _path ? `${rootPath}/${_path}` : rootPath;
  const dir = await fs.promises.opendir(dirPath);

  for await (const dirent of dir) {

    const name = dirent.name;
    const path = _path ? `${_path}/${name}` : name;

    if (dirent.isDirectory()) {
      await getListOfFiles(rootPath, path, _fileList);
    } else {
      _fileList.push(path);
    }
  }

  return _fileList;
}

/**
 * Gets extension from string, or empty string if no extension found.
 * @arg {String} file path string.
 * @returns {String} extension.
 */
function getExtension(str) {

  if (typeof str !== 'string') {
    return '';
  }

  const idx = str.lastIndexOf('.');
  return idx >= 0 ? str.substring(idx) : '';
}

/**
 * Processes a .tmpl file into .html
 * @arg {String} .tmpl input file
 * @arg {String} .html output file
 */
async function processTmplFile(path, outPath) {

  await ensureDirectoryForFile(outPath);
  const templateFile = await fs.promises.readFile('./main.tmpl', 'utf8');
  const contents = await fs.promises.readFile(path, 'utf8');

  const stylesheetsMatch = contents.match(/<!--STYLESHEETS-START-->(.*)<!--STYLESHEETS-END-->/s);
  const scriptsMatch = contents.match(/<!--SCRIPTS-START-->(.*)<!--SCRIPTS-END-->/s);
  const contentMatch = contents.match(/<!--CONTENT-START-->(.*)<!--CONTENT-END-->/s);

  const result = templateFile
    .replace('<!--STYLESHEETS-HERE-->', stylesheetsMatch ? stylesheetsMatch[1] : '')
    .replace('<!--SCRIPTS-HERE-->', scriptsMatch ? scriptsMatch[1] : '')
    .replace('<!--CONTENT-HERE-->', contentMatch ? contentMatch[1] : '');

  await fs.promises.writeFile(outPath, result, 'utf8');
}

/**
 * Processes a .less file into .css
 * @arg {String} .less input file
 * @arg {String} .css output file
 */
async function processLessFile(path, outPath) {

  await ensureDirectoryForFile(outPath);
  const contents = await fs.promises.readFile(path, 'utf8');
  const cssResult = await less.render(contents, {});
  await fs.promises.writeFile(outPath, cssResult.css, 'utf8');
}

/**
 * Processes a .js file by transpiling it.
 * @arg {String} .js input file.
 * @arg {String} .js output file.
 */
async function processJsFile(path, outPath) {

  await ensureDirectoryForFile(outPath);
  const contents = await fs.promises.readFile(path, 'utf8');

  const babelResult = babel.transform(contents, {
    presets: [
      ['@babel/preset-env', {
        targets: { ie: '11' }
      }]
    ]
  });
  
  await fs.promises.writeFile(outPath, babelResult.code, 'utf8');
}

/**
 * Main function.
 */
async function main() {

  const rootPath = '../src';
  const distPath = '../dist';
  const paths = await getListOfFiles(rootPath);

  for (let path of paths) {
    const sourcePath = `${rootPath}/${path}`;
    switch (getExtension(path)) {
      case '.tmpl': {
        const outName = path.replace(/\.tmpl$/, '.html');
        await processTmplFile(sourcePath, `${distPath}/${outName}`);
        break;
      };
      case '.less': {
        const outName = path.replace(/\.less$/, '.css');
        await processLessFile(sourcePath, `${distPath}/${outName}`);
        break;
      };
      case '.js': {
        await processJsFile(sourcePath, `${distPath}/${path}`);
        break;
      };
      default: {
        const destPath = `${distPath}/${path}`;
        await ensureDirectoryForFile(destPath);
        await fs.promises.copyFile(sourcePath, destPath);
        break;
      }
    }
  }
}

main();
