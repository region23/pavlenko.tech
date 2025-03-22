/**
 * File Handler Module
 * Manages file system operations for the static site generator
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisified file system functions
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readDirAsync = promisify(fs.readdir);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);

/**
 * Read file contents
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File contents
 */
async function readFile(filePath) {
  try {
    return await readFileAsync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 */
async function writeFile(filePath, content) {
  try {
    // Ensure the directory exists
    await ensureDirectoryExists(path.dirname(filePath));
    await writeFileAsync(filePath, content);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Ensure a directory exists, create if not
 * @param {string} dirPath - Path to the directory
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await mkdirAsync(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if (error.code !== 'EEXIST') {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }
}

/**
 * List files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {string} extension - Optional file extension filter
 * @returns {Promise<string[]>} - Array of file names
 */
async function listFiles(dirPath, extension = null) {
  try {
    const files = await readDirAsync(dirPath);
    if (extension) {
      return files.filter(file => file.endsWith(extension));
    }
    return files;
  } catch (error) {
    console.error(`Error listing files in ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Copy a file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 */
async function copyFile(sourcePath, destPath) {
  try {
    const content = await readFile(sourcePath);
    await writeFile(destPath, content);
  } catch (error) {
    console.error(`Error copying file from ${sourcePath} to ${destPath}:`, error);
    throw error;
  }
}

/**
 * Copy a directory recursively
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 */
async function copyDirectory(sourceDir, destDir) {
  try {
    await ensureDirectoryExists(destDir);
    
    const entries = await readDirAsync(sourceDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, destPath);
      } else {
        await copyFile(sourcePath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying directory from ${sourceDir} to ${destDir}:`, error);
    throw error;
  }
}

module.exports = {
  readFile,
  writeFile,
  ensureDirectoryExists,
  listFiles,
  copyFile,
  copyDirectory
}; 