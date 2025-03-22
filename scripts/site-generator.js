#!/usr/bin/env node

/**
 * Static Site Generator
 * A modern static site generator for the Pavlenko.tech blog
 */

const fs = require('fs');
const path = require('path');
const TemplateEngine = require('../src/engine/template');
const ContentProcessor = require('../src/engine/content');
const AssetPipeline = require('../src/engine/assets');

// Define paths
const CONTENT_DIR = path.join(__dirname, '../content');
const TEMPLATES_DIR = path.join(__dirname, '../src/templates');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const STATIC_DIR = path.join(__dirname, '../static');

// Default site configuration
const defaultConfig = {
  title: 'Pavlenko.tech',
  description: 'Personal blog about technology, programming, and software development',
  hostname: 'pavlenko.tech',
  language: 'en',
  postsPerPage: 10,
  defaultAuthor: 'Konstantin Pavlenko'
};

/**
 * Load site configuration from file
 * @returns {Object} Site configuration
 */
function loadConfig() {
  const configPath = path.join(__dirname, '../config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.warn(`Warning: Failed to load config file: ${error.message}`);
    console.log('Using default configuration');
  }
  
  return defaultConfig;
}

/**
 * Copy static assets to output directory
 */
async function copyStaticAssets() {
  try {
    // Create static directory if it doesn't exist
    if (!fs.existsSync(path.join(OUTPUT_DIR, 'static'))) {
      fs.mkdirSync(path.join(OUTPUT_DIR, 'static'), { recursive: true });
    }
    
    // Read all files from static directory
    const files = fs.readdirSync(STATIC_DIR);
    
    // Copy each file to output directory
    for (const file of files) {
      const sourcePath = path.join(STATIC_DIR, file);
      const targetPath = path.join(OUTPUT_DIR, 'static', file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${file} to /static/`);
      }
    }
  } catch (error) {
    console.error('Error copying static assets:', error);
  }
}

/**
 * Generate static site
 */
async function generateStaticSite() {
  try {
    console.time('Static site generation completed in');
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Copy static assets
    await copyStaticAssets();
    
    // Process content
    const config = loadConfig();
    const templateEngine = new TemplateEngine(TEMPLATES_DIR);
    const contentProcessor = new ContentProcessor(CONTENT_DIR, OUTPUT_DIR, config);
    const { pages } = await contentProcessor.processContent();
    
    // Generate HTML files
    for (const url in pages) {
      const page = pages[url];
      const outputPath = path.join(OUTPUT_DIR, url.replace(/^\//, ''));
      
      // Create directory if it doesn't exist
      const outputDirectory = path.dirname(outputPath);
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }
      
      // Ensure index.html for directory URLs
      const finalPath = url.endsWith('/') 
        ? path.join(outputPath, 'index.html')
        : `${outputPath}.html`;
      
      // Default data to ensure title and description are present
      const defaultData = {
        site: config,
        title: config.title,
        description: config.description,
        navigation: config.navigation,
        social: config.social
      };

      // Create the page data object that will be passed to the template
      // We need to ensure all variables are available at the root level
      let pageData = { 
        ...defaultData,
        // Ensure these variables always exist even if empty, to prevent reference errors
        post: {
          headings: [],
          tags: [],
          readingTime: '',
          excerpt: '',
          previousPost: null,
          nextPost: null
        },
        tag: {
          posts: [],
          pagination: {
            nextPage: null,
            prevPage: null,
            currentPage: 1,
            totalPages: 1
          }
        },
        pagination: {
          nextPage: null,
          prevPage: null,
          currentPage: 1,
          totalPages: 1
        },
        posts: []
      };

      // First, add all direct properties from the page object
      Object.entries(page).forEach(([key, value]) => {
        if (key !== 'data' && key !== 'template' && key !== 'url') {
          pageData[key] = value;
        }
      });

      // Then add all properties from page.data, keeping nested objects intact
      if (page.data) {
        Object.entries(page.data).forEach(([key, value]) => {
          // Don't overwrite existing values unless it's a complex object we want to merge
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof pageData[key] === 'object' && !Array.isArray(pageData[key])) {
            // Merge objects instead of replacing them
            pageData[key] = { ...pageData[key], ...value };
          } else {
            // For arrays and other values, replace with the value from page.data
            pageData[key] = value;
          }
        });
      }

      // Debug: log when important variables are missing meaningful content
      if (page.template.includes('pages/post.html') && (!pageData.post || Object.keys(pageData.post).length === 0)) {
        console.warn(`Warning: 'post' variable is empty in ${page.template} for ${page.url}`);
      }
      if (page.template.includes('pages/tag.html') && (!pageData.tag || Object.keys(pageData.tag).length === 0)) {
        console.warn(`Warning: 'tag' variable is empty in ${page.template} for ${page.url}`);
      }
      
      try {
        const htmlContent = templateEngine.render(page.template, pageData);
        
        // Post-process the HTML to remove any unprocessed template tags
        const processedHtml = postProcessHtml(htmlContent);
        
        fs.writeFileSync(finalPath, processedHtml);
        console.log(`Generated: ${url}`);
      } catch (error) {
        console.error(`Error generating ${url}:`, error);
      }
    }
    
    console.timeEnd('Static site generation completed in');
  } catch (error) {
    console.error('Error generating static site:', error);
    throw error;
  }
}

/**
 * Post-process HTML to remove unprocessed template tags
 * @param {string} html - Raw HTML content
 * @returns {string} - Processed HTML content
 */
function postProcessHtml(html) {
  // Replace unprocessed template loops
  let processed = html.replace(/{%\s*for\s+.*?%}(.*?){%\s*endfor\s*%}/gs, '');
  
  // Replace unprocessed template conditionals
  processed = processed.replace(/{%\s*if\s+.*?%}(.*?){%\s*endif\s*%}/gs, '');
  processed = processed.replace(/{%\s*else\s*%}(.*?){%\s*endif\s*%}/gs, '');
  
  // Replace any remaining template variables
  processed = processed.replace(/{{.*?}}/g, '');
  
  // Remove empty lines
  processed = processed.replace(/^\s*[\r\n]/gm, '');
  
  return processed;
}

// Run the generator
generateStaticSite().catch(error => {
  console.error('Error generating site:', error);
  process.exit(1);
}); 