/**
 * Configuration Manager Module
 * Handles loading and validating configuration for the static site generator
 */

const path = require('path');
const { readFile } = require('./fileHandler');

// Configuration schema for validation
const CONFIG_SCHEMA = {
  site: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    language: { type: 'string', required: true }
  },
  content: {
    postsPerPage: { type: 'number', required: true, min: 1 }
  },
  paths: {
    contentDir: { type: 'string', required: true },
    outputDir: { type: 'string', required: true }
  }
};

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

// Cache for loaded configuration
let configCache = null;

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} - New merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' && 
        source[key] !== null && 
        !Array.isArray(source[key])
      ) {
        // If property exists in target and is an object, merge recursively
        if (target[key] && typeof target[key] === 'object') {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          // Otherwise just copy from source
          output[key] = { ...source[key] };
        }
      } else {
        // For non-objects, just copy the value
        output[key] = source[key];
      }
    }
  }
  
  return output;
}

/**
 * Validate a config value against schema
 * @param {any} value - Config value to validate
 * @param {Object} schema - Schema definition for the value
 * @param {string} path - Path in the config for error reporting
 * @returns {Array} - Array of validation errors, empty if valid
 */
function validateValue(value, schema, path) {
  const errors = [];
  
  // Check required
  if (schema.required && (value === undefined || value === null)) {
    errors.push(`${path} is required`);
    return errors;
  }
  
  // Skip further validation if value is not provided
  if (value === undefined || value === null) {
    return errors;
  }
  
  // Check type
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      errors.push(`${path} should be of type ${schema.type}, got ${actualType}`);
    }
  }
  
  // Check min value for numbers
  if (schema.type === 'number' && schema.min !== undefined && value < schema.min) {
    errors.push(`${path} should be at least ${schema.min}`);
  }
  
  // Check min length for strings and arrays
  if ((schema.type === 'string' || schema.type === 'array') && 
      schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push(`${path} should have length of at least ${schema.minLength}`);
  }
  
  return errors;
}

/**
 * Validate configuration against schema
 * @param {Object} config - Configuration to validate
 * @returns {Object} - Validation result {valid: boolean, errors: string[]}
 */
function validateConfig(config) {
  const errors = [];
  
  // Helper function to validate section recursively
  function validateSection(sectionConfig, sectionSchema, path) {
    for (const key in sectionSchema) {
      const propertyPath = path ? `${path}.${key}` : key;
      const schema = sectionSchema[key];
      
      // If schema is a nested object with properties
      if (typeof schema === 'object' && !schema.type) {
        // Create section if it doesn't exist
        if (!sectionConfig[key]) {
          sectionConfig[key] = {};
        }
        validateSection(sectionConfig[key], schema, propertyPath);
      } else {
        // Validate leaf property
        const propertyErrors = validateValue(sectionConfig[key], schema, propertyPath);
        errors.push(...propertyErrors);
        
        // Set default value if needed
        if (
          schema.required && 
          (sectionConfig[key] === undefined || sectionConfig[key] === null) && 
          DEFAULT_CONFIG[path] && DEFAULT_CONFIG[path][key] !== undefined
        ) {
          sectionConfig[key] = DEFAULT_CONFIG[path][key];
          console.log(`Warning: ${propertyPath} not specified, using default: ${sectionConfig[key]}`);
        }
      }
    }
  }
  
  // Validate each section
  for (const section in CONFIG_SCHEMA) {
    if (!config[section]) {
      config[section] = {};
    }
    validateSection(config[section], CONFIG_SCHEMA[section], section);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Add derived properties to config
 * @param {Object} config - Configuration object
 * @returns {Object} - Configuration with derived properties
 */
function addDerivedProperties(config) {
  const newConfig = { ...config };
  
  // Add path-related properties
  if (newConfig.paths) {
    newConfig.paths = { 
      ...newConfig.paths,
      postsDir: path.join(newConfig.paths.contentDir, 'posts'),
      aboutDir: path.join(newConfig.paths.contentDir, 'about')
    };
  }
  
  return newConfig;
}

/**
 * Load configuration from file and apply defaults
 * @param {string} configPath - Path to the configuration file
 * @param {boolean} useCache - Whether to use cached config (default true)
 * @returns {Promise<Object>} - Loaded configuration with defaults applied
 */
async function loadConfig(configPath = path.join(__dirname, '../../config.json'), useCache = true) {
  // Return cached config if requested and available
  if (useCache && configCache !== null) {
    return configCache;
  }

  try {
    // Read and parse config file
    const configData = await readFile(configPath);
    const loadedConfig = JSON.parse(configData);
    
    // Merge with default config
    let mergedConfig = deepMerge(DEFAULT_CONFIG, loadedConfig);
    
    // Add derived properties
    mergedConfig = addDerivedProperties(mergedConfig);
    
    // Validate config
    const { valid, errors } = validateConfig(mergedConfig);
    
    if (!valid) {
      console.warn('Configuration validation errors:');
      errors.forEach(err => console.warn(`- ${err}`));
    }
    
    // Update cache
    configCache = mergedConfig;
    
    return mergedConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    console.log('Using default configuration');
    
    // Add derived properties to default config
    const defaultWithDerived = addDerivedProperties(DEFAULT_CONFIG);
    
    // Update cache
    configCache = defaultWithDerived;
    
    return defaultWithDerived;
  }
}

/**
 * Get the current configuration
 * @param {boolean} useCache - Whether to return cached config or throw if not loaded
 * @returns {Object} - Current configuration
 */
function getConfig(useCache = true) {
  if (configCache === null && !useCache) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }
  return configCache || DEFAULT_CONFIG;
}

/**
 * Clear configuration cache
 */
function clearConfigCache() {
  configCache = null;
}

module.exports = {
  loadConfig,
  getConfig,
  clearConfigCache,
  validateConfig
}; 