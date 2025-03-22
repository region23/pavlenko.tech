/**
 * Configuration Manager Module
 * Handles loading and validating configuration for the static site generator
 */

const path = require('path');
const { readFile } = require('./fileHandler');

// Default configuration
const DEFAULT_CONFIG = {
  site: {
    title: 'Pavlenko Tech Blog',
    description: 'Технический блог о разработке',
    language: 'ru-RU'
  },
  content: {
    postsPerPage: 10
  },
  paths: {
    contentDir: path.join(__dirname, '../../content'),
    outputDir: path.join(__dirname, '../../dist')
  }
};

let config = null;

/**
 * Load configuration from file and apply defaults
 * @param {string} configPath - Path to the configuration file
 * @returns {Object} - Loaded configuration with defaults applied
 */
async function loadConfig(configPath = path.join(__dirname, '../../config.json')) {
  if (config !== null) {
    return config; // Return cached config if already loaded
  }

  try {
    const configData = await readFile(configPath);
    const loadedConfig = JSON.parse(configData);
    
    // Merge with default config
    config = mergeConfigs(DEFAULT_CONFIG, loadedConfig);
    
    // Add derived path properties
    config.paths.postsDir = path.join(config.paths.contentDir, 'posts');
    config.paths.aboutDir = path.join(config.paths.contentDir, 'about');
    
    // Validate config
    validateConfig(config);
    
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    console.log('Using default configuration');
    config = DEFAULT_CONFIG;
    return config;
  }
}

/**
 * Merge default config with loaded config
 * @param {Object} defaultConfig - Default configuration
 * @param {Object} loadedConfig - Loaded configuration from file
 * @returns {Object} - Merged configuration
 */
function mergeConfigs(defaultConfig, loadedConfig) {
  const result = { ...defaultConfig };
  
  // Merge each section
  for (const section in loadedConfig) {
    if (typeof loadedConfig[section] === 'object' && loadedConfig[section] !== null) {
      result[section] = { 
        ...(result[section] || {}), 
        ...loadedConfig[section] 
      };
    } else {
      result[section] = loadedConfig[section];
    }
  }
  
  return result;
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 */
function validateConfig(config) {
  // Ensure required properties exist
  if (!config.content.postsPerPage) {
    config.content.postsPerPage = 10;
    console.log('Warning: content.postsPerPage not specified, using default: 10');
  }
  
  if (!config.site.title) {
    config.site.title = DEFAULT_CONFIG.site.title;
    console.log(`Warning: site.title not specified, using default: ${DEFAULT_CONFIG.site.title}`);
  }
}

/**
 * Get the current configuration
 * @returns {Object} - Current configuration
 */
function getConfig() {
  if (config === null) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }
  return config;
}

module.exports = {
  loadConfig,
  getConfig
}; 