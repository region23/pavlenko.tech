/**
 * Static Site Generator for Markdown Blog
 * 
 * This script generates a complete static site from markdown content:
 * - Home page with pagination
 * - Individual blog posts
 * - Tag pages
 * - About page
 * - 404 page
 * - Sitemap.xml
 */

const { buildSite } = require('./lib/siteBuilder');

/**
 * Main function to start the build process
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      verbose: args.includes('--verbose') || args.includes('-v')
    };
    
    // Run the build
    await buildSite(options);
  } catch (error) {
    console.error('Error running site generator:', error);
    process.exit(1);
  }
}

// Start the build process
main(); 