/**
 * Markdown Blog Engine
 * Main entry point exporting all public APIs
 */

const siteBuilder = require('../scripts/lib/siteBuilder');
const markdownProcessor = require('../scripts/lib/markdownProcessor');
const templateEngine = require('../scripts/lib/templateEngine');
const configManager = require('../scripts/lib/configManager');
const fileHandler = require('../scripts/lib/fileHandler');
const cssGenerator = require('../scripts/lib/cssGenerator');

module.exports = {
  // Site building
  buildSite: siteBuilder.buildSite,
  
  // Markdown processing
  renderMarkdown: markdownProcessor.renderMarkdown,
  extractFrontmatter: markdownProcessor.extractFrontmatter,
  calculateReadingTime: markdownProcessor.calculateReadingTime,
  
  // Template management
  renderTemplate: templateEngine.processTemplate,
  generatePage: templateEngine.generatePage,
  
  // Configuration
  loadConfig: configManager.loadConfig,
  getConfig: configManager.getConfig,
  
  // File handling
  readFile: fileHandler.readFile,
  writeFile: fileHandler.writeFile,
  ensureDirectoryExists: fileHandler.ensureDirectoryExists,
  
  // CSS processing
  generateCSS: cssGenerator.generateCSS
}; 