/**
 * Site Builder Module
 * Orchestrates the site building process
 */

const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

const { loadConfig, getConfig } = require('./configManager');
const { readFile, writeFile, ensureDirectoryExists, listFiles, copyDirectory } = require('./fileHandler');
const { renderMarkdown, extractFrontmatter, calculateReadingTime, formatDate } = require('./markdownProcessor');
const { 
  generatePage, 
  generatePostContent, 
  generatePostCard, 
  generatePagination 
} = require('./templateEngine');

/**
 * Build the entire site
 * @param {Object} options - Build options
 */
async function buildSite(options = {}) {
  try {
    console.log('Starting site build...');
    
    // Load configuration
    await loadConfig();
    const config = getConfig();
    
    // Create output directory if it doesn't exist
    await ensureDirectoryExists(config.paths.outputDir);
    
    // Load all posts
    const posts = await loadAllPosts();
    
    // Generate static assets
    await generateStaticAssets();
    
    // Build each section of the site
    await Promise.all([
      buildHomePage(posts),
      buildPostPages(posts),
      buildTagPages(posts),
      buildAboutPage(),
      buildErrorPage(),
      buildSitemap(posts)
    ]);
    
    console.log('Site build completed successfully!');
  } catch (error) {
    console.error('Error building site:', error);
    process.exit(1);
  }
}

/**
 * Load all posts from the content directory
 * Now builds the index in memory instead of relying on a file
 */
async function loadAllPosts() {
  const config = getConfig();
  const POSTS_DIR = config.paths.postsDir;
  
  try {
    console.log('Loading and processing markdown files...');
    
    // Directly scan posts directory for markdown files
    const files = await listFiles(POSTS_DIR, '.md');
    console.log(`Found ${files.length} markdown files`);
    
    // Process each file
    const posts = await Promise.all(files.map(async (filename) => {
      try {
        const filePath = path.join(POSTS_DIR, filename);
        const content = await readFile(filePath);
        
        // Extract frontmatter and content
        const { content: markdownContent, data } = extractFrontmatter(content);
        
        // Validate required fields
        if (!data.title || !data.date) {
          console.warn(`Warning: Missing required fields in ${filename}`);
          
          // If date is missing, use file modification date
          if (!data.date) {
            const stats = fs.statSync(filePath);
            data.date = stats.mtime.toISOString().split('T')[0];
          }
          
          // If title is missing, use filename
          if (!data.title) {
            data.title = filename.replace('.md', '').replace(/-/g, ' ');
          }
        }
        
        // Generate HTML from markdown
        const html = renderMarkdown(markdownContent);
        
        // Calculate reading time
        const readingTime = calculateReadingTime(markdownContent);
        
        // Format the date
        const formattedDate = formatDate(data.date);
        
        // Generate post URL
        const fileName = filename.replace('.md', '');
        const url = `/posts/${fileName}/`;
        
        // Return complete post object
        return {
          file: fileName,
          title: data.title,
          date: data.date,
          tags: data.tags || [],
          summary: data.summary || '',
          content: markdownContent,
          html,
          readingTime,
          formattedDate,
          url,
          ...data
        };
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
        return null;
      }
    }));
    
    // Filter out null entries and sort by date
    const validPosts = posts
      .filter(post => post !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Processed ${validPosts.length} valid posts`);
    return validPosts;
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

/**
 * Extract and organize tags from posts
 */
function extractTags(posts) {
  const tags = {};
  
  posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(post);
      });
    }
  });
  
  return tags;
}

/**
 * Generate static assets (copy css, js, images)
 */
async function generateStaticAssets() {
  const config = getConfig();
  
  try {
    // Copy static directories
    const staticDirs = ['css', 'js', 'images'];
    
    for (const dir of staticDirs) {
      const sourcePath = path.join(__dirname, '../../', dir);
      const destPath = path.join(config.paths.outputDir, dir);
      
      if (fs.existsSync(sourcePath)) {
        await copyDirectory(sourcePath, destPath);
      }
    }
    
    // Copy root files 
    const rootFiles = ['.htaccess', '_redirects', 'favicon.ico', '.nojekyll'];
    
    for (const file of rootFiles) {
      const sourcePath = path.join(__dirname, '../../', file);
      const destPath = path.join(config.paths.outputDir, file);
      
      if (fs.existsSync(sourcePath)) {
        const content = await readFile(sourcePath);
        await writeFile(destPath, content);
      }
    }
  } catch (error) {
    console.error('Error generating static assets:', error);
    throw error;
  }
}

/**
 * Build the home page with paginated posts
 */
async function buildHomePage(posts) {
  const config = getConfig();
  const postsPerPage = config.content.postsPerPage;
  
  try {
    // Calculate total pages
    const totalPages = Math.ceil(posts.length / postsPerPage);
    
    // Generate each page
    for (let page = 1; page <= totalPages; page++) {
      const start = (page - 1) * postsPerPage;
      const end = start + postsPerPage;
      const pagePosts = posts.slice(start, end);
      
      // Generate post cards
      const postCards = pagePosts.map(post => generatePostCard(post)).join('');
      
      // Generate pagination
      const pagination = generatePagination({
        currentPage: page,
        totalPages,
        basePath: '/'
      });
      
      // Generate page content
      const content = `
        <div class="posts-list">
          <h1 class="page-title">${page === 1 ? 'Последние записи' : `Страница ${page}`}</h1>
          ${postCards}
          ${pagination}
        </div>
      `;
      
      // Generate full page HTML
      const html = generatePage({
        title: page === 1 ? config.site.title : `Страница ${page} | ${config.site.title}`,
        description: config.site.description,
        content,
        config
      });
      
      // Write to file
      const pageDir = page === 1 ? 
        config.paths.outputDir : 
        path.join(config.paths.outputDir, 'page', String(page));
      
      await ensureDirectoryExists(pageDir);
      await writeFile(path.join(pageDir, 'index.html'), html);
    }
  } catch (error) {
    console.error('Error building home page:', error);
    throw error;
  }
}

/**
 * Build individual post pages
 */
async function buildPostPages(posts) {
  const config = getConfig();
  
  try {
    for (const post of posts) {
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
      await ensureDirectoryExists(postDir);
      await writeFile(path.join(postDir, 'index.html'), html);
    }
  } catch (error) {
    console.error('Error building post pages:', error);
    throw error;
  }
}

/**
 * Build tag pages
 */
async function buildTagPages(posts) {
  const config = getConfig();
  
  try {
    const tags = extractTags(posts);
    
    for (const [tag, tagPosts] of Object.entries(tags)) {
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
      await ensureDirectoryExists(tagDir);
      await writeFile(path.join(tagDir, 'index.html'), html);
    }
  } catch (error) {
    console.error('Error building tag pages:', error);
    throw error;
  }
}

/**
 * Build about page
 */
async function buildAboutPage() {
  const config = getConfig();
  
  try {
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
      await ensureDirectoryExists(aboutDir);
      await writeFile(path.join(aboutDir, 'index.html'), fullHtml);
    }
  } catch (error) {
    console.error('Error building about page:', error);
    throw error;
  }
}

/**
 * Build 404 error page
 */
async function buildErrorPage() {
  const config = getConfig();
  
  try {
    // Generate page content
    const content = `
      <div class="error-page">
        <h1>404</h1>
        <h2>Страница не найдена</h2>
        <p>Страница, которую вы запрашиваете, не существует.</p>
        <p><a href="/" class="button">Вернуться на главную</a></p>
      </div>
    `;
    
    // Generate full page HTML
    const html = generatePage({
      title: '404 - Страница не найдена',
      description: 'Страница не найдена',
      content,
      config
    });
    
    // Write to file
    await writeFile(path.join(config.paths.outputDir, '404.html'), html);
  } catch (error) {
    console.error('Error building error page:', error);
    throw error;
  }
}

/**
 * Build sitemap.xml
 */
async function buildSitemap(posts) {
  const config = getConfig();
  
  try {
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
    await writeFile(path.join(config.paths.outputDir, 'sitemap.xml'), sitemap);
  } catch (error) {
    console.error('Error building sitemap:', error);
    throw error;
  }
}

module.exports = {
  buildSite
}; 