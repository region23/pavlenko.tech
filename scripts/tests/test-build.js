/**
 * Test script to verify the functionality of the improved modules
 */

const path = require('path');
const { buildSite } = require('../lib/siteBuilder');
const { loadConfig, getConfig } = require('../lib/configManager');
const { updateConfig: updateMarkdownConfig } = require('../lib/markdownProcessor');
const { updateConfig: updateTemplateConfig } = require('../lib/templateEngine');
const { updateConfig: updateFileHandlerConfig } = require('../lib/fileHandler');

// Configuration for testing
const TEST_CONFIG = {
  // Enable verbose logging for more detailed output
  verbose: true,
  // Clean output directory before building
  clean: true,
  // Override certain config values for testing
  configOverrides: {
    // Sample configuration overrides
    site: {
      url: 'https://pavlenko.tech'
    },
    content: {
      postsPerPage: 5 // Use smaller page size for testing
    },
    markdown: {
      cacheRendering: true,
      readingTime: {
        wordsPerMinute: 180
      }
    },
    templates: {
      cacheTemplates: true
    },
    files: {
      enableCache: true,
      cacheTTL: 30000 // 30 seconds for testing
    }
  }
};

/**
 * Run the test build
 */
async function runTest() {
  try {
    console.log('=== Starting test build ===');
    console.log('Loading configuration...');
    
    // Load the base configuration
    await loadConfig();
    let config = getConfig();
    
    // Apply test overrides
    if (TEST_CONFIG.configOverrides) {
      // Update module-specific configurations
      if (TEST_CONFIG.configOverrides.markdown) {
        console.log('Applying markdown configuration overrides...');
        updateMarkdownConfig(TEST_CONFIG.configOverrides.markdown);
      }
      
      if (TEST_CONFIG.configOverrides.templates) {
        console.log('Applying template configuration overrides...');
        updateTemplateConfig(TEST_CONFIG.configOverrides.templates);
      }
      
      if (TEST_CONFIG.configOverrides.files) {
        console.log('Applying file handler configuration overrides...');
        updateFileHandlerConfig(TEST_CONFIG.configOverrides.files);
      }
      
      // Apply site-specific overrides directly to the main config
      if (TEST_CONFIG.configOverrides.site) {
        console.log('Applying site configuration overrides...');
        config.site = { ...config.site, ...TEST_CONFIG.configOverrides.site };
      }
      
      if (TEST_CONFIG.configOverrides.content) {
        console.log('Applying content configuration overrides...');
        config.content = { ...config.content, ...TEST_CONFIG.configOverrides.content };
      }
      
      console.log('Using configuration with testing overrides');
    }
    
    // Log build configuration
    console.log(`Building site with configurations:`);
    console.log(`- Site URL: ${config.site.url}`);
    console.log(`- Posts per page: ${config.content.postsPerPage}`);
    console.log(`- Output directory: ${config.paths.outputDir}`);
    
    // Start site build with test options
    console.log('Running site build with verbose logging...');
    const startTime = Date.now();
    
    await buildSite({
      verbose: TEST_CONFIG.verbose,
      clean: TEST_CONFIG.clean
    });
    
    const endTime = Date.now();
    console.log(`=== Build completed in ${(endTime - startTime) / 1000}s ===`);
    console.log(`Site built to: ${config.paths.outputDir}`);
    
    // Verify output
    console.log('\nVerification steps (manual):');
    console.log('1. Check that the output directory contains index.html');
    console.log('2. Check that posts and tag pages were created');
    console.log('3. Verify sitemap.xml exists and has correct URLs');
    console.log('4. Check that no errors were logged during build');
    
  } catch (error) {
    console.error('Test build failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error during test:', error);
  process.exit(1);
}); 