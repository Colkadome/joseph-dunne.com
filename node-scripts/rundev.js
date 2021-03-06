
// Npm.
const fs = require('fs');
const less = require('less');
const babel = require('@babel/core');
const LessPluginCleanCSS = require('less-plugin-clean-css');

// Lib.
const httpServer = require('./lib/httpServer');

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
    if (name.startsWith('.')) {
      continue;  // Ignore hidden folders.
    }

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
async function processTmplFile(path, outPath, options) {
  options = { ...options };

  await ensureDirectoryForFile(outPath);
  const templateFile = await fs.promises.readFile('./templates/main.tmpl', 'utf8');
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
async function processLessFile(path, outPath, options) {
  options = { ...options };

  const lessOpts = {};
  if (options.prod) {
    const cleanCSSPlugin = new LessPluginCleanCSS();
    lessOpts.plugins = [cleanCSSPlugin];
  }

  await ensureDirectoryForFile(outPath);
  const contents = await fs.promises.readFile(path, 'utf8');
  const cssResult = await less.render(contents, lessOpts);
  await fs.promises.writeFile(outPath, cssResult.css, 'utf8');
}

/**
 * Processes a .js file by transpiling it.
 * @arg {String} .js input file.
 * @arg {String} .js output file.
 */
async function processJsFile(path, outPath, options) {
  options = { ...options };

  await ensureDirectoryForFile(outPath);
  let contents = await fs.promises.readFile(path, 'utf8');

  // Transpile if production.
  // Dev doesn't need any transpiling.
  if (options.prod) {
    const babelResult = babel.transform(contents, {
      comments: false,
      presets: [
        ['@babel/preset-env', {
          targets: { ie: '11' }
        }],
        ['minify', {

        }]
      ]
    });
    contents = babelResult.code;
  }
  
  await fs.promises.writeFile(outPath, contents, 'utf8');
}

/**
 * Processes a file.
 * @arg {String} path to file.
 */
async function processFile(path, outPath, options) {
  options = { ...options };

  switch (getExtension(path)) {
    case '.tmpl': {
      outPath = outPath.replace(/\.tmpl$/, '.html');
      await processTmplFile(path, outPath, options);
      break;
    };
    case '.less': {
      outPath = outPath.replace(/\.less$/, '.css');
      await processLessFile(path, outPath, options);
      break;
    };
    case '.js': {
      await processJsFile(path, outPath, options);
      break;
    };
    default: {
      await ensureDirectoryForFile(outPath);
      await fs.promises.copyFile(path, outPath);
      break;
    }
  }

  console.log('out:', outPath);
}

/**
 * Function to build all files.
 */
async function buildFiles(rootPath, distPath, opts) {

  const paths = await getListOfFiles(rootPath);

  for (let path of paths) {
    try {
      await processFile(`${rootPath}/${path}`, `${distPath}/${path}`, opts);
    } catch (err) {
      console.log(err);
    }
  }
}

/**
 * Function to monitor files.
 */
async function watch(rootPath, distPath, opts) {

  const PORT = 8000;
  const server = httpServer(distPath, PORT);
  console.log(`Listening on port ${PORT}`);

  fs.watch(rootPath, { recursive: true, encoding: 'utf8' }, function (eventType, filename) {
    if (eventType === 'change') {
      processFile(`${rootPath}/${filename}`, `${distPath}/${filename}`, opts);
    }
  });
}

/**
 * Main function.
 */
async function rundev() {

  const rootPath = '../src';
  const distPath = '../dist';
  await buildFiles(rootPath, distPath);

  watch(rootPath, distPath);
}


/**
 * Main function.
 */
async function runprod() {

  const rootPath = '../src';
  const distPath = '../dist';
  await buildFiles(rootPath, distPath, { prod: true });

  watch(rootPath, distPath, { prod: true });
}

/**
 * Main building function.
 */
async function build() {

  const rootPath = '../src';
  const distPath = '../dist';
  await buildFiles(rootPath, distPath, { prod: true });
}

// Check what command is being run.
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('arg required');
  return;
}
switch (args[0]) {
  case 'build': return build();
  case 'rundev': return rundev();
  case 'runprod': return runprod();
  default: console.log(`command '${args[0]}' not recognised`);
}
