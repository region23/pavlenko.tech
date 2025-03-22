/**
 * Asset Pipeline
 * Handles copying static assets and generating JavaScript bundles
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AssetPipeline {
  constructor(staticDir, outputDir, config) {
    this.staticDir = staticDir;
    this.outputDir = outputDir;
    this.config = config;
  }

  /**
   * Process all assets
   */
  async processAssets() {
    console.log('Processing assets...');
    
    // Clean the output directory (preserving specified files)
    await this.cleanOutputDirectory();
    
    // Copy static assets
    await this.copyStaticAssets();
    
    // Generate theme.js
    await this.generateThemeJs();
    
    console.log('Asset processing complete.');
  }

  /**
   * Clean the output directory while preserving specified files/directories
   * @param {Array} preservePatterns - Patterns to preserve
   */
  async cleanOutputDirectory(preservePatterns = ['.git', '.nojekyll']) {
    console.log('Cleaning output directory...');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      return;
    }
    
    // Don't clean if output directory doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      return;
    }
    
    const items = fs.readdirSync(this.outputDir);
    
    for (const item of items) {
      // Skip preserved items
      if (preservePatterns.includes(item)) {
        continue;
      }
      
      const itemPath = path.join(this.outputDir, item);
      
      try {
        if (fs.lstatSync(itemPath).isDirectory()) {
          // Recursively remove directory
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          // Remove file
          fs.unlinkSync(itemPath);
        }
      } catch (error) {
        console.error(`Error removing ${itemPath}: ${error.message}`);
      }
    }
  }

  /**
   * Copy static assets to the output directory
   */
  async copyStaticAssets() {
    console.log('Copying static assets...');
    
    if (!fs.existsSync(this.staticDir)) {
      console.warn(`Static directory ${this.staticDir} does not exist. Skipping static assets.`);
      return;
    }
    
    await this.copyDirectory(this.staticDir, this.outputDir);
  }

  /**
   * Recursively copy a directory
   * @param {string} sourceDir - Source directory
   * @param {string} targetDir - Target directory
   */
  async copyDirectory(sourceDir, targetDir) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const items = fs.readdirSync(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        // Recursively copy subdirectory
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        // Copy file
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Generate the theme.js file
   */
  async generateThemeJs() {
    console.log('Generating theme.js...');
    
    const jsDir = path.join(this.outputDir, 'js');
    
    // Create js directory if it doesn't exist
    if (!fs.existsSync(jsDir)) {
      fs.mkdirSync(jsDir, { recursive: true });
    }
    
    const themeJsPath = path.join(jsDir, 'theme.js');
    
    // Theme toggle script
    const themeJs = `/**
 * Theme Toggle
 * Handles light/dark theme switching and persistence
 */

(function() {
  // Get the theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  
  // Check for saved theme preference or use the system preference
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const initialTheme = savedTheme || systemTheme;
  
  // Helper function to set theme
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update button text
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }
  
  // Set initial theme
  setTheme(initialTheme);
  
  // Toggle theme when button is clicked
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only change theme if user hasn't manually set a preference
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
})();`;
    
    fs.writeFileSync(themeJsPath, themeJs);
  }
}

module.exports = AssetPipeline; 