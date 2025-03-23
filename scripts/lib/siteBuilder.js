/**
 * Site Builder Module
 * Orchestrates the site building process
 */

const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

const { loadConfig, getConfig } = require('./configManager');
const { readFile, writeFile, ensureDirectoryExists, listFiles, copyDirectory } = require('./fileHandler');
const { renderMarkdown, extractFrontmatter, calculateReadingTime, formatDate, updateConfig: updateMarkdownConfig } = require('./markdownProcessor');
const { 
  generatePage, 
  generatePostContent, 
  generatePostCard, 
  generatePagination,
  loadTemplate,
  processTemplate,
  renderComponent,
  updateConfig: updateTemplateConfig
} = require('./templateEngine');

// Default options for site building
const DEFAULT_OPTIONS = {
  verbose: false,
  clean: false
};

// Helper for logging when verbose mode is enabled
function log(message, options) {
  if (options && options.verbose) {
    console.log(message);
  }
}

/**
 * Write content to a file and ensure its directory exists
 * @param {string} filePath - Path to write to
 * @param {string} content - Content to write
 */
async function writeOutput(filePath, content) {
  await ensureDirectoryExists(path.dirname(filePath));
  await writeFile(filePath, content);
}

/**
 * Process a markdown file into a post object
 * @param {string} filePath - Path to the markdown file
 * @param {string} filename - Filename of the markdown file
 * @returns {Object|null} - Processed post object or null if error
 */
async function processPostFile(filePath, filename) {
  try {
    const content = await readFile(filePath);
    
    // Extract frontmatter and content
    const { content: markdownContent, data } = extractFrontmatter(content);
    
    // Set default values for missing required fields
    const postData = { ...data };
    
    // If date is missing, use file modification date
    if (!postData.date) {
      const stats = fs.statSync(filePath);
      postData.date = stats.mtime.toISOString().split('T')[0];
      console.warn(`Warning: Missing date in ${filename}, using file modification date`);
    }
    
    // If title is missing, use filename
    if (!postData.title) {
      postData.title = filename.replace('.md', '').replace(/-/g, ' ');
      console.warn(`Warning: Missing title in ${filename}, using normalized filename`);
    }
    
    // Generate HTML from markdown
    const html = renderMarkdown(markdownContent);
    
    // Calculate reading time
    const readingTime = calculateReadingTime(markdownContent);
    
    // Format the date
    const formattedDate = formatDate(postData.date);
    
    // Generate post URL
    const fileName = filename.replace('.md', '');
    const url = `/posts/${fileName}/`;
    
    // Return complete post object
    return {
      file: fileName,
      title: postData.title,
      date: postData.date,
      tags: postData.tags || [],
      summary: postData.summary || '',
      content: markdownContent,
      html,
      readingTime,
      formattedDate,
      url,
      ...postData
    };
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error);
    return null;
  }
}

/**
 * Load all posts from the content directory
 * @param {Object} options - Processing options
 * @returns {Array} - Array of processed posts
 */
async function loadAllPosts(options = {}) {
  const config = getConfig();
  const POSTS_DIR = config.paths.postsDir;
  
  try {
    log('Loading and processing markdown files...', options);
    
    // Scan posts directory for markdown files
    const files = await listFiles(POSTS_DIR, '.md');
    log(`Found ${files.length} markdown files`, options);
    
    // Process each file
    const posts = await Promise.all(
      files.map(filename => 
        processPostFile(path.join(POSTS_DIR, filename), filename)
      )
    );
    
    // Filter out null entries and sort by date
    const validPosts = posts
      .filter(post => post !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    log(`Processed ${validPosts.length} valid posts`, options);
    return validPosts;
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

/**
 * Extract and organize tags from posts
 * @param {Array} posts - Array of post objects
 * @returns {Object} - Object with tags as keys and arrays of posts as values
 */
function extractTags(posts) {
  return posts.reduce((tags, post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(post);
      });
    }
    return tags;
  }, {});
}

/**
 * Generate static assets (copy css, js, images)
 * @param {Object} options - Build options
 */
async function generateStaticAssets(options = {}) {
  const config = getConfig();
  
  try {
    // Copy static directories
    const staticDirs = ['css', 'js', 'images'];
    
    await Promise.all(staticDirs.map(async (dir) => {
      const sourcePath = path.join(__dirname, '../../', dir);
      const destPath = path.join(config.paths.outputDir, dir);
      
      if (fs.existsSync(sourcePath)) {
        log(`Copying ${dir} directory...`, options);
        await copyDirectory(sourcePath, destPath);
      }
    }));
    
    // Copy root files 
    const rootFiles = ['.htaccess', '_redirects', 'favicon.ico', '.nojekyll'];
    
    await Promise.all(rootFiles.map(async (file) => {
      const sourcePath = path.join(__dirname, '../../', file);
      const destPath = path.join(config.paths.outputDir, file);
      
      if (fs.existsSync(sourcePath)) {
        log(`Copying ${file}...`, options);
        const content = await readFile(sourcePath);
        await writeFile(destPath, content);
      }
    }));
  } catch (error) {
    console.error('Error generating static assets:', error);
    throw error;
  }
}

/**
 * Generate paginated content
 * @param {Array} items - Array of items to paginate
 * @param {Object} options - Pagination options
 * @returns {Array} - Array of page objects with itemsForPage and pagination properties
 */
function paginateItems(items, options) {
  const { 
    perPage = 10, 
    basePath = '/',
    pageTitle = (page) => page === 1 ? 'Последние записи' : `Страница ${page}`
  } = options;
  
  // Calculate total pages
  const totalPages = Math.ceil(items.length / perPage);
  const pages = [];
  
  // Generate page objects
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const itemsForPage = items.slice(start, end);
    
    // Generate pagination
    const pagination = totalPages > 1 ? generatePagination({
      currentPage: page,
      totalPages,
      basePath
    }) : '';
    
    pages.push({
      page,
      title: pageTitle(page),
      itemsForPage,
      pagination,
      isFirstPage: page === 1
    });
  }
  
  return pages;
}

/**
 * Build the home page with paginated posts
 * @param {Array} posts - Array of post objects
 * @param {Object} options - Build options
 */
async function buildHomePage(posts, options = {}) {
  const config = getConfig();
  
  try {
    log('Building home page...', options);
    
    // Generate paginated content
    const pages = paginateItems(posts, {
      perPage: config.content.postsPerPage,
      basePath: '/'
    });
    
    // Generate each page
    await Promise.all(pages.map(async ({ page, title, itemsForPage, pagination, isFirstPage }) => {
      // Generate post cards
      const postCards = itemsForPage.map(post => generatePostCard(post)).join('');
      
      // Generate page content
      const content = `
        <div class="posts-list">
          <h1 class="page-title">${title}</h1>
          ${postCards}
          ${pagination}
        </div>
      `;
      
      // Generate full page HTML
      const html = generatePage({
        title: isFirstPage ? config.site.title : `Страница ${page} | ${config.site.title}`,
        description: config.site.description,
        content,
        config
      });
      
      // Write to file
      const pageDir = isFirstPage ? 
        config.paths.outputDir : 
        path.join(config.paths.outputDir, 'page', String(page));
      
      await writeOutput(path.join(pageDir, 'index.html'), html);
    }));
  } catch (error) {
    console.error('Error building home page:', error);
    throw error;
  }
}

/**
 * Build individual post pages
 * @param {Array} posts - Array of post objects
 * @param {Object} options - Build options
 */
async function buildPostPages(posts, options = {}) {
  const config = getConfig();
  
  try {
    log(`Building ${posts.length} post pages...`, options);
    
    await Promise.all(posts.map(async (post) => {
      // Generate post content
      const postContent = generatePostContent(post, config);
      
      // Generate full page HTML
      const html = generatePage({
        title: post.title,
        description: post.summary || '',
        content: postContent,
        config,
        meta: {
          canonical: `${config.site.url}${post.url}`
        }
      });
      
      // Create directory and write file
      const postDir = path.join(config.paths.outputDir, 'posts', post.file);
      await writeOutput(path.join(postDir, 'index.html'), html);
    }));
  } catch (error) {
    console.error('Error building post pages:', error);
    throw error;
  }
}

/**
 * Build tag pages
 * @param {Array} posts - Array of post objects
 * @param {Object} options - Build options
 */
async function buildTagPages(posts, options = {}) {
  const config = getConfig();
  
  try {
    const tags = extractTags(posts);
    const tagCount = Object.keys(tags).length;
    log(`Building ${tagCount} tag pages...`, options);
    
    await Promise.all(Object.entries(tags).map(async ([tag, tagPosts]) => {
      // Generate post cards
      const postCards = tagPosts.map(post => generatePostCard(post)).join('');
      
      // Generate page content
      const content = `
        <div class="posts-list">
          <h1 class="page-title">Записи с тегом: ${tag}</h1>
          ${postCards}
        </div>
      `;
      
      // Generate full page HTML
      const html = generatePage({
        title: `${tag} | ${config.site.title}`,
        description: `Записи с тегом ${tag}`,
        content,
        config
      });
      
      // Create directory and write file
      const tagDir = path.join(config.paths.outputDir, 'tags', encodeURIComponent(tag));
      await writeOutput(path.join(tagDir, 'index.html'), html);
    }));
  } catch (error) {
    console.error('Error building tag pages:', error);
    throw error;
  }
}

/**
 * Build about page
 * @param {Object} options - Build options
 */
async function buildAboutPage(options = {}) {
  const config = getConfig();
  
  try {
    log('Building about page...', options);
    
    const aboutPath = path.join(config.paths.aboutDir, 'index.md');
    
    if (fs.existsSync(aboutPath)) {
      const aboutContent = await readFile(aboutPath);
      const { content, data } = extractFrontmatter(aboutContent);
      
      // Generate HTML from markdown
      const html = renderMarkdown(content);
      
      // Generate page content
      const pageContent = `
        <div class="about-page">
          <h1>${data.title || 'Обо мне'}</h1>
          <div class="about-content">
            ${html}
          </div>
        </div>
      `;
      
      // Generate full page HTML
      const fullHtml = generatePage({
        title: data.title || 'Обо мне',
        description: data.description || config.site.description,
        content: pageContent,
        config
      });
      
      // Create directory and write file
      const aboutDir = path.join(config.paths.outputDir, 'about');
      await writeOutput(path.join(aboutDir, 'index.html'), fullHtml);
    } else {
      log('About page content not found, skipping', options);
    }
  } catch (error) {
    console.error('Error building about page:', error);
    throw error;
  }
}

/**
 * Build 404 error page
 * @param {Object} options - Build options
 */
async function buildErrorPage(options = {}) {
  const config = getConfig();
  
  try {
    log('Building 404 error page...', options);
    
    // Generate content using the error template
    const content = renderComponent('error', {});
    
    // Generate full page HTML
    const html = generatePage({
      title: '404 - Страница не найдена',
      description: 'Страница не найдена',
      content,
      config
    });
    
    // Write to file
    await writeOutput(path.join(config.paths.outputDir, '404.html'), html);
  } catch (error) {
    console.error('Error building error page:', error);
    throw error;
  }
}

/**
 * Build sitemap.xml
 * @param {Array} posts - Array of post objects
 * @param {Object} options - Build options
 */
async function buildSitemap(posts, options = {}) {
  const config = getConfig();
  
  try {
    log('Building sitemap.xml...', options);
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add home page
    sitemap += `  <url>\n    <loc>${config.site.url}/</loc>\n    <priority>1.0</priority>\n  </url>\n`;
    
    // Add about page
    sitemap += `  <url>\n    <loc>${config.site.url}/about/</loc>\n    <priority>0.8</priority>\n  </url>\n`;
    
    // Add posts
    posts.forEach(post => {
      const date = new Date(post.date).toISOString().split('T')[0];
      sitemap += `  <url>\n    <loc>${config.site.url}${post.url}</loc>\n    <lastmod>${date}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
    });
    
    // Add tag pages
    const tags = extractTags(posts);
    Object.keys(tags).forEach(tag => {
      sitemap += `  <url>\n    <loc>${config.site.url}/tags/${encodeURIComponent(tag)}/</loc>\n    <priority>0.5</priority>\n  </url>\n`;
    });
    
    sitemap += '</urlset>';
    
    // Write to file
    await writeOutput(path.join(config.paths.outputDir, 'sitemap.xml'), sitemap);
  } catch (error) {
    console.error('Error building sitemap:', error);
    throw error;
  }
}

/**
 * Build the entire site
 * @param {Object} options - Build options
 */
async function buildSite(options = {}) {
  const buildOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    console.log('Starting site build...');
    
    // Load configuration
    await loadConfig();
    const config = getConfig();
    
    // Update module configurations based on site config
    if (config.markdown) {
      updateMarkdownConfig(config.markdown);
    }
    
    if (config.templates) {
      updateTemplateConfig(config.templates);
    }
    
    // Create output directory if it doesn't exist
    await ensureDirectoryExists(config.paths.outputDir);
    
    // Load all posts
    const posts = await loadAllPosts(buildOptions);
    
    // Generate static assets
    await generateStaticAssets(buildOptions);
    
    // Build each section of the site in parallel
    await Promise.all([
      buildHomePage(posts, buildOptions),
      buildPostPages(posts, buildOptions),
      buildTagPages(posts, buildOptions),
      buildAboutPage(buildOptions),
      buildErrorPage(buildOptions),
      buildSitemap(posts, buildOptions)
    ]);
    
    console.log('Site build completed successfully!');
  } catch (error) {
    console.error('Error building site:', error);
    process.exit(1);
  }
}

module.exports = {
  buildSite,
  // Export internal functions for testing or direct use
  loadAllPosts,
  extractTags,
  generateStaticAssets,
  buildHomePage,
  buildPostPages,
  buildTagPages,
  buildAboutPage,
  buildErrorPage,
  buildSitemap
}; 