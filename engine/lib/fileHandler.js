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
const copyFileAsync = promisify(fs.copyFile);

// Simple cache for frequently accessed files
const fileCache = new Map();
const MAX_CACHE_SIZE = 100; // Maximum number of files to cache

// Configuration
let config = {
  enableCache: true,
  cacheTTL: 60000, // 1 minute in milliseconds
};

/**
 * Update module configuration
 * @param {Object} newConfig - New configuration options
 */
function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  
  // Clear cache if disabled
  if (!config.enableCache) {
    fileCache.clear();
  }
}

/**
 * Handle operation errors consistently
 * @param {Function} operation - Async operation to execute
 * @param {string} errorMessage - Error message prefix
 * @param {boolean} throwError - Whether to throw the error (default) or return null
 * @returns {Promise<any>} - Result of the operation or null if failed and throwError is false
 */
async function handleOperation(operation, errorMessage, throwError = true) {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    if (throwError) {
      throw error;
    }
    return null;
  }
}

/**
 * Add file content to cache
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 */
function addToCache(filePath, content) {
  if (!config.enableCache) return;
  
  // Limit cache size by removing oldest entries
  if (fileCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = fileCache.keys().next().value;
    fileCache.delete(oldestKey);
  }
  
  fileCache.set(filePath, {
    content,
    timestamp: Date.now()
  });
}

/**
 * Get file content from cache if valid
 * @param {string} filePath - Path to the file
 * @returns {string|null} - Cached content or null if not in cache or expired
 */
function getFromCache(filePath) {
  if (!config.enableCache) return null;
  
  const cached = fileCache.get(filePath);
  if (!cached) return null;
  
  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > config.cacheTTL) {
    fileCache.delete(filePath);
    return null;
  }
  
  return cached.content;
}

/**
 * Read file contents
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File contents
 */
async function readFile(filePath) {
  // Check cache first
  const cachedContent = getFromCache(filePath);
  if (cachedContent) return cachedContent;
  
  return handleOperation(
    async () => {
      const content = await readFileAsync(filePath, 'utf8');
      addToCache(filePath, content);
      return content;
    },
    `Error reading file ${filePath}`
  );
}

/**
 * Write content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 */
async function writeFile(filePath, content) {
  await handleOperation(
    async () => {
      // Ensure the directory exists
      await ensureDirectoryExists(path.dirname(filePath));
      await writeFileAsync(filePath, content);
      addToCache(filePath, content); // Update cache
    },
    `Error writing file ${filePath}`
  );
}

/**
 * Ensure a directory exists, create if not
 * @param {string} dirPath - Path to the directory
 */
async function ensureDirectoryExists(dirPath) {
  await handleOperation(
    async () => {
      try {
        await mkdirAsync(dirPath, { recursive: true });
      } catch (error) {
        // Ignore if directory already exists
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    },
    `Error creating directory ${dirPath}`
  );
}

/**
 * List files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {string} extension - Optional file extension filter
 * @returns {Promise<string[]>} - Array of file names
 */
async function listFiles(dirPath, extension = null) {
  return handleOperation(
    async () => {
      const files = await readDirAsync(dirPath);
      if (extension) {
        return files.filter(file => file.endsWith(extension));
      }
      return files;
    },
    `Error listing files in ${dirPath}`
  );
}

/**
 * Copy a file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 */
async function copyFile(sourcePath, destPath) {
  await handleOperation(
    async () => {
      await ensureDirectoryExists(path.dirname(destPath));
      await copyFileAsync(sourcePath, destPath);
    },
    `Error copying file from ${sourcePath} to ${destPath}`
  );
}

/**
 * Copy a directory recursively
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 */
async function copyDirectory(sourceDir, destDir) {
  await handleOperation(
    async () => {
      await ensureDirectoryExists(destDir);
      
      const entries = await readDirAsync(sourceDir, { withFileTypes: true });
      
      // Process directories first, then files (helps with parallel operations)
      const directories = entries.filter(entry => entry.isDirectory());
      const files = entries.filter(entry => !entry.isDirectory());
      
      // Process directories
      for (const entry of directories) {
        const sourcePath = path.join(sourceDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        await copyDirectory(sourcePath, destPath);
      }
      
      // Process files in parallel for better performance
      await Promise.all(files.map(async (entry) => {
        const sourcePath = path.join(sourceDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        await copyFile(sourcePath, destPath);
      }));
    },
    `Error copying directory from ${sourceDir} to ${destDir}`
  );
}

/**
 * Clear the file cache
 */
function clearCache() {
  fileCache.clear();
}

module.exports = {
  readFile,
  writeFile,
  ensureDirectoryExists,
  listFiles,
  copyFile,
  copyDirectory,
  updateConfig,
  clearCache
}; 