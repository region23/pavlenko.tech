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

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const frontmatter = require('gray-matter');
const { markedSmartypants } = require('marked-smartypants');
const { gfmHeadingId } = require('marked-gfm-heading-id');
const cheerio = require('cheerio');

// Constants
const CONTENT_DIR = path.join(__dirname, '../content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const ABOUT_DIR = path.join(CONTENT_DIR, 'about');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const CONFIG_PATH = path.join(__dirname, '../config.json');

// Configuration
let config;

// Load and validate config
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = JSON.parse(configData);
    
    // Ensure required config properties exist
    if (!config.content.postsPerPage) {
      config.content.postsPerPage = 10; // Default value
      console.log('Warning: content.postsPerPage not specified, using default: 10');
    }
    
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    process.exit(1);
  }
}

/**
 * Configure Marked renderer
 */
function configureMarked() {
  // Custom renderer
  const renderer = {
    // Code blocks with syntax highlighting
    code(code, language) {
      return `<pre><code class="language-${language || 'text'}">${code}</code></pre>`;
    },
    
    // Links with proper handling
    link(href, title, text) {
      if (!href) href = '';
      const titleAttr = title ? ` title="${title}"` : '';
      // External links get target="_blank"
      const targetAttr = href.startsWith && href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${titleAttr}${targetAttr}>${text}</a>`;
    },
    
    // Image handling
    image(href, title, text) {
      if (!href) href = '';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<figure><img src="${href}" alt="${text || ''}"${titleAttr}><figcaption>${text || ''}</figcaption></figure>`;
    }
  };
  
  // Set marked options
  marked.use({
    renderer: renderer,
    gfm: true,
    breaks: true,
    smartLists: true
  });

  // Add extensions
  marked.use(markedSmartypants());
  marked.use(gfmHeadingId());
}

/**
 * Process Markdown content to HTML
 */
function renderMarkdown(markdown) {
  if (!markdown) return '';
  
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return `<p>Error rendering content.</p>`;
  }
}

/**
 * Calculate estimated reading time
 */
function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text) return 1;
  
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return Math.max(1, minutes);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Load all posts from the content directory
 */
async function loadAllPosts() {
  try {
    // Check if posts index exists
    const indexPath = path.join(POSTS_DIR, 'index.json');
    
    if (fs.existsSync(indexPath)) {
      // Load from index
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      
      // Load full content for each post
      const posts = await Promise.all(indexData.map(async (post) => {
        const postPath = path.join(POSTS_DIR, `${post.file}.md`);
        
        if (!fs.existsSync(postPath)) {
          console.warn(`Warning: Post file not found: ${postPath}`);
          return null;
        }
        
        const postContent = fs.readFileSync(postPath, 'utf8');
        const { content, data } = frontmatter(postContent);
        
        // Combine index metadata with full content
        return {
          ...post,
          ...data,
          content: content
        };
      }));
      
      // Filter out null entries and sort by date
      return posts
        .filter(post => post !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      // Manually scan posts directory if no index
      console.log('Posts index not found, scanning directory...');
      
      const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
      
      const posts = await Promise.all(files.map(async (file) => {
        const postPath = path.join(POSTS_DIR, file);
        const postContent = fs.readFileSync(postPath, 'utf8');
        const { content, data } = frontmatter(postContent);
        
        // Extract post data
        return {
          file: file.replace('.md', ''),
          title: data.title,
          date: data.date,
          tags: data.tags || [],
          summary: data.summary || '',
          content: content,
          ...data
        };
      }));
      
      // Sort by date
      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
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
 * Generate pagination data
 */
function generatePagination(posts, postsPerPage) {
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  
  console.log(`Created ${totalPages} pagination pages`);
  
  const pages = [];
  
  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;
    const start = i * postsPerPage;
    const end = start + postsPerPage;
    const pagePosts = posts.slice(start, end);
    
    pages.push({
      number: pageNumber,
      posts: pagePosts,
      hasPrev: pageNumber > 1,
      hasNext: pageNumber < totalPages,
      prevUrl: pageNumber === 2 ? '/' : `/page/${pageNumber - 1}`,
      nextUrl: `/page/${pageNumber + 1}`,
      total: totalPages,
      url: pageNumber === 1 ? '/' : `/page/${pageNumber}`  // Add URL for sitemap
    });
  }
  
  return pages;
}

/**
 * Load About page content
 */
async function loadAboutContent() {
  try {
    const aboutPath = path.join(ABOUT_DIR, 'index.md');
    
    if (!fs.existsSync(aboutPath)) {
      console.warn('Warning: About page content not found');
      return { content: '', data: {} };
    }
    
    const fileContent = fs.readFileSync(aboutPath, 'utf8');
    const { content, data } = frontmatter(fileContent);
    
    return { content, data };
  } catch (error) {
    console.error('Error loading about content:', error);
    return { content: '', data: {} };
  }
}

/**
 * Generate base HTML template
 */
function generateBaseHtml(title, content, metaDescription = '', canonical = '') {
  const siteTitle = config.site.title;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const description = metaDescription || config.site.description;
  const canonicalLink = canonical ? `<link rel="canonical" href="https://${config.site.hostname || 'pavlenko.tech'}${canonical}">` : '';

  return `<!DOCTYPE html>
<html lang="${config.site.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self' localhost:*;">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  ${canonicalLink}
  
  <!-- Fonts and styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <div class="container">
      <nav>
        <div class="logo-container">
          <a href="/" class="logo">${config.site.title}</a>
          <span class="site-description">${config.site.description}</span>
        </div>
        <ul class="nav-links">
          ${config.navigation.items.map(item => `
            <li><a href="${item.url}">${item.label}</a></li>
          `).join('')}
        </ul>
        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sun-icon">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="moon-icon" style="display:none;">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      ${content}
    </div>
  </main>

  <footer>
    <div class="container">
      <p>${config.site.copyright}</p>
      <div class="footer-links">
        ${config.social.links.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.platform}</a>
        `).join('')}
      </div>
    </div>
  </footer>

  <!-- Minimal JavaScript for theme toggle and pagination -->
  <script src="/js/theme.js"></script>
</body>
</html>`;
}

/**
 * Extract headings from HTML content for table of contents
 */
function extractHeadings(html) {
  const $ = cheerio.load(html);
  const headings = [];
  
  // Find all h2 and h3 headings
  $('h2, h3').each((index, element) => {
    const $heading = $(element);
    // Add ID if not exists
    if (!$heading.attr('id')) {
      $heading.attr('id', `heading-${index}`);
    }
    
    headings.push({
      id: $heading.attr('id'),
      text: $heading.text(),
      level: parseInt(element.name.substring(1)) // Get number from h2, h3
    });
  });
  
  return headings;
}

/**
 * Create table of contents HTML from headings
 */
function createTableOfContents(headings) {
  if (headings.length <= 1) {
    return '';
  }
  
  let tocHtml = '<div class="table-of-contents">\n';
  tocHtml += '<h3>Содержание</h3>\n';
  tocHtml += '<ul>\n';
  
  headings.forEach(heading => {
    const indentStyle = heading.level === 3 ? 'style="margin-left: 1rem;"' : '';
    tocHtml += `<li ${indentStyle}><a href="#${heading.id}">${heading.text}</a></li>\n`;
  });
  
  tocHtml += '</ul>\n</div>';
  return tocHtml;
}

/**
 * Generate post HTML
 */
function generatePostHtml(post) {
  const { title, date, tags, author } = post;
  const postAuthor = author || config.content.defaultAuthor;
  const formattedDate = formatDate(date);
  const htmlContent = renderMarkdown(post.content);
  const readingTime = calculateReadingTime(htmlContent, config.content.wordsPerMinute);
  
  // Extract headings and create table of contents
  const headings = extractHeadings(htmlContent);
  const tableOfContents = createTableOfContents(headings);
  
  // Generate tags HTML
  let tagsHtml = '';
  if (tags && tags.length > 0) {
    tagsHtml = `
      <div class="post-tags">
        ${tags.map(tag => `<a href="/tags/${tag}" class="tag">${tag}</a>`).join('')}
      </div>
    `;
  }
  
  const content = `
    <article class="post">
      <header class="post-header">
        <h1>${title}</h1>
        <div class="post-meta">
          <time datetime="${date}">${formattedDate}</time>
          ${postAuthor ? `<span class="post-author">автор: ${postAuthor}</span>` : ''}
          ${readingTime ? `<span class="reading-time">${readingTime} мин. чтения</span>` : ''}
        </div>
        ${tagsHtml}
      </header>
      
      ${tableOfContents}
      
      <div class="post-content">
        ${htmlContent}
      </div>
      
      <div class="social-share">
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}&text=${encodeURIComponent(title)}" class="social-button twitter-share" target="_blank" rel="noopener">Поделиться в Twitter</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}" class="social-button linkedin-share" target="_blank" rel="noopener">Поделиться в LinkedIn</a>
        <a href="https://t.me/share/url?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}&text=${encodeURIComponent(title)}" class="social-button telegram-share" target="_blank" rel="noopener">Поделиться в Telegram</a>
      </div>
    </article>
  `;
  
  return generateBaseHtml(
    title, 
    content, 
    post.summary, 
    `/posts/${post.slug || post.file}`
  );
}

/**
 * Generate pagination controls
 */
function generatePaginationControls(page) {
  // Don't show pagination at all if there's only one page
  if (page.total <= 1) {
    return '';
  }
  
  return `
    <div class="pagination">
      ${page.hasPrev ? `<a href="${page.prevUrl}" class="pagination-prev">← Предыдущая</a>` : '<span class="pagination-prev disabled">← Предыдущая</span>'}
      <span class="pagination-info">Страница ${page.number} из ${page.total}</span>
      ${page.hasNext ? `<a href="${page.nextUrl}" class="pagination-next">Следующая →</a>` : '<span class="pagination-next disabled">Следующая →</span>'}
    </div>
  `;
}

/**
 * Generate post list HTML for home page and pagination
 */
function generatePostListHtml(page) {
  const posts = page.posts;
  
  const postsHtml = posts.map(post => {
    const formattedDate = formatDate(post.date);
    
    // Generate tags HTML
    let tagsHtml = '';
    if (post.tags && post.tags.length > 0) {
      tagsHtml = `
        <div class="post-tags">
          ${post.tags.map(tag => `<a href="/tags/${tag}" class="tag">${tag}</a>`).join('')}
        </div>
      `;
    }
    
    return `
      <li class="post-item">
        <h2 class="post-title"><a href="/posts/${post.slug || post.file}">${post.title}</a></h2>
        <div class="post-meta">
          <time datetime="${post.date}">${formattedDate}</time>
          ${post.author ? `<span class="post-author">автор: ${post.author}</span>` : ''}
          ${calculateReadingTime(post.content || '', config.content.wordsPerMinute) ? 
            `<span class="reading-time">${calculateReadingTime(post.content || '', config.content.wordsPerMinute)} мин. чтения</span>` : ''}
        </div>
        <p class="post-summary">${post.summary || ''}</p>
        ${tagsHtml}
      </li>
    `;
  }).join('');
  
  const paginationControls = generatePaginationControls(page);
  const content = `
    <h1>${page.number > 1 ? `Записи - Страница ${page.number}` : 'Последние записи'}</h1>
    <ul class="post-list">
      ${postsHtml}
    </ul>
    ${paginationControls}
  `;
  
  return generateBaseHtml(
    page.number > 1 ? `Page ${page.number}` : 'Home', 
    content, 
    config.site.description, 
    page.number > 1 ? `/page/${page.number}` : '/'
  );
}

/**
 * Generate tag page HTML
 */
function generateTagPageHtml(tag, posts) {
  const postsHtml = posts.map(post => {
    const formattedDate = formatDate(post.date);
    
    return `
      <li class="post-item">
        <h2 class="post-title"><a href="/posts/${post.slug || post.file}">${post.title}</a></h2>
        <div class="post-meta">
          <time datetime="${post.date}">${formattedDate}</time>
          ${post.author ? `<span class="post-author">автор: ${post.author}</span>` : ''}
          ${calculateReadingTime(post.content || '', config.content.wordsPerMinute) ? 
            `<span class="reading-time">${calculateReadingTime(post.content || '', config.content.wordsPerMinute)} мин. чтения</span>` : ''}
        </div>
        <p class="post-summary">${post.summary || ''}</p>
      </li>
    `;
  }).join('');
  
  const content = `
    <h1>Записи с тегом "${tag}"</h1>
    <ul class="post-list">
      ${posts.length > 0 ? postsHtml : '<p>Записи с этим тегом не найдены.</p>'}
    </ul>
    <div class="back-link">
      <a href="/tags">← Все теги</a>
    </div>
  `;
  
  return generateBaseHtml(
    `Тег: ${tag}`, 
    content, 
    `Записи с тегом ${tag}`, 
    `/tags/${tag}`
  );
}

/**
 * Generate tags list page HTML
 */
function generateTagsListHtml(tagCounts) {
  // Sort tags by name
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  const tagsHtml = sortedTags
    .map(([tag, count]) => `
      <a href="/tags/${tag}" class="tag-cloud-item">${tag} <span>(${count})</span></a>
    `)
    .join('');
  
  const content = `
    <div class="tags-page">
      <h1 class="page-title">Теги</h1>
      <div class="tags-cloud">
        ${tagsHtml}
      </div>
    </div>
  `;
  
  return generateBaseHtml('Теги', content, 'Просмотр всех тегов', '/tags');
}

/**
 * Generate about page HTML
 */
function generateAboutPageHtml(aboutData) {
  const { content, data } = aboutData;
  const htmlContent = renderMarkdown(content);
  
  const pageContent = `
    <div class="about-page">
      <div class="about-content">
        ${htmlContent}
      </div>
    </div>
  `;
  
  return generateBaseHtml(
    data.title || 'About', 
    pageContent, 
    data.summary || 'About page', 
    '/about'
  );
}

/**
 * Generate 404 page HTML
 */
function generate404Html() {
  const content = `
    <div class="error-page">
      <h1>404</h1>
      <h2>Страница не найдена</h2>
      <p>Страница, которую вы ищете, не существует или была перемещена.</p>
      <a href="/" class="button">На главную</a>
    </div>
  `;
  
  return generateBaseHtml('Страница не найдена', content);
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(pages, posts, tags) {
  const hostname = config.site.hostname || 'pavlenko.tech';
  const baseUrl = `https://${hostname}`;
  
  // Start with XML declaration and opening tags
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add home page
  sitemap += `
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  
  // Add pagination pages (except first page which is home)
  pages.slice(1).forEach(page => {
    sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
  
  // Add about page
  sitemap += `
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  
  // Add tags page
  sitemap += `
  <url>
    <loc>${baseUrl}/tags</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  
  // Add individual tag pages
  Object.keys(tags).forEach(tag => {
    sitemap += `
  <url>
    <loc>${baseUrl}/tags/${tag}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
  });
  
  // Add individual posts
  posts.forEach(post => {
    const lastmod = new Date(post.date).toISOString().split('T')[0];
    sitemap += `
  <url>
    <loc>${baseUrl}/posts/${post.slug || post.file}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });
  
  // Close sitemap
  sitemap += `
</urlset>`;
  
  return sitemap;
}

/**
 * Delete directory contents recursively but keep the directory itself
 * Optionally preserve certain files/directories
 */
function cleanDirectory(directory, preserveItems = []) {
  if (!fs.existsSync(directory)) {
    return;
  }
  
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    if (preserveItems.includes(item)) {
      continue; // Skip preserved items
    }
    
    const itemPath = path.join(directory, item);
    
    if (fs.statSync(itemPath).isDirectory()) {
      // Recursively clean subdirectory
      cleanDirectory(itemPath);
      // Don't remove the directory itself
    } else {
      // Remove file
      fs.unlinkSync(itemPath);
    }
  }
}

// Main function to be implemented
async function generateStaticSite() {
  console.log('Starting static site generation...');
  
  // Load config
  loadConfig();
  
  // Configure markdown renderer
  configureMarked();
  
  // Ensure output directory exists
  ensureDirectories();
  
  // Clean output directory (preserve .git if exists)
  console.log('Cleaning output directory...');
  cleanDirectory(OUTPUT_DIR, ['.git', '.nojekyll']);
  
  try {
    // Load all posts
    console.log('Loading posts...');
    const posts = await loadAllPosts();
    console.log(`Loaded ${posts.length} posts`);
    
    // Extract tags
    console.log('Extracting tags...');
    const tags = extractTags(posts);
    console.log(`Found ${Object.keys(tags).length} unique tags`);
    
    // Generate pagination
    console.log('Generating pagination...');
    const pages = generatePagination(posts, config.content.postsPerPage);
    console.log(`Created ${pages.length} pagination pages`);
    
    // Load about page content
    console.log('Loading about page content...');
    const aboutData = await loadAboutContent();
    
    // Copy static assets
    console.log('Copying static assets...');
    copyStaticAssets();
    
    // Create JavaScript utils
    console.log('Creating JavaScript utils...');
    createJavaScriptUtils();
    
    // Generate individual post pages
    console.log('Generating post pages...');
    posts.forEach(post => {
      const html = generatePostHtml(post);
      const outputDir = path.join(OUTPUT_DIR, 'posts');
      const outputPath = path.join(outputDir, `${post.slug || post.file}.html`);
      
      // For clean URLs without .html extension, create a directory and put index.html inside
      const cleanUrlDir = path.join(outputDir, post.slug || post.file);
      if (!fs.existsSync(cleanUrlDir)) {
        fs.mkdirSync(cleanUrlDir, { recursive: true });
      }
      fs.writeFileSync(path.join(cleanUrlDir, 'index.html'), html, 'utf8');
      
      // Also generate the .html version for direct access
      fs.writeFileSync(outputPath, html, 'utf8');
    });
    
    // Generate tag pages
    console.log('Generating tag pages...');
    Object.entries(tags).forEach(([tag, tagPosts]) => {
      const html = generateTagPageHtml(tag, tagPosts);
      
      // For clean URLs, create directory with index.html
      const tagDir = path.join(OUTPUT_DIR, 'tags', tag);
      if (!fs.existsSync(tagDir)) {
        fs.mkdirSync(tagDir, { recursive: true });
      }
      fs.writeFileSync(path.join(tagDir, 'index.html'), html, 'utf8');
      
      // Also write the .html version
      fs.writeFileSync(path.join(OUTPUT_DIR, 'tags', `${tag}.html`), html, 'utf8');
    });
    
    // Generate tags index page
    console.log('Generating tags index page...');
    const tagCounts = {};
    Object.entries(tags).forEach(([tag, posts]) => {
      tagCounts[tag] = posts.length;
    });
    const tagsIndexHtml = generateTagsListHtml(tagCounts);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tags', 'index.html'), tagsIndexHtml, 'utf8');
    
    // Generate pagination pages
    console.log('Generating home page and pagination pages...');
    pages.forEach((page, index) => {
      const html = generatePostListHtml(page);
      
      if (index === 0) {
        // Home page
        fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html, 'utf8');
      } else {
        // Pagination pages with clean URLs
        const pageDir = path.join(OUTPUT_DIR, 'page', `${page.number}`);
        if (!fs.existsSync(pageDir)) {
          fs.mkdirSync(pageDir, { recursive: true });
        }
        fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf8');
        
        // Also write the .html version
        fs.writeFileSync(path.join(OUTPUT_DIR, 'page', `${page.number}.html`), html, 'utf8');
      }
    });
    
    // Generate about page
    console.log('Generating about page...');
    const aboutHtml = generateAboutPageHtml(aboutData);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'about', 'index.html'), aboutHtml, 'utf8');
    
    // Generate 404 page
    console.log('Generating 404 page...');
    const notFoundHtml = generate404Html();
    fs.writeFileSync(path.join(OUTPUT_DIR, '404.html'), notFoundHtml, 'utf8');
    
    // Generate sitemap.xml
    console.log('Generating sitemap.xml...');
    const sitemap = generateSitemap(pages, posts, tags);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap, 'utf8');
    
    // Create htaccess for Apache servers
    if (fs.existsSync(path.join(__dirname, '../.htaccess'))) {
      fs.copyFileSync(
        path.join(__dirname, '../.htaccess'), 
        path.join(OUTPUT_DIR, '.htaccess')
      );
    }
    
    // Create _redirects for Netlify
    if (fs.existsSync(path.join(__dirname, '../_redirects'))) {
      fs.copyFileSync(
        path.join(__dirname, '../_redirects'), 
        path.join(OUTPUT_DIR, '_redirects')
      );
    }
    
    console.log('Static site generation completed successfully!');
  } catch (error) {
    console.error('Error during static site generation:', error);
    process.exit(1);
  }
}

// Create necessary directories
function ensureDirectories() {
  // Base output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Other directories to create
  const dirsToCreate = [
    path.join(OUTPUT_DIR, 'posts'),
    path.join(OUTPUT_DIR, 'tags'),
    path.join(OUTPUT_DIR, 'page'),
    path.join(OUTPUT_DIR, 'about'),
    path.join(OUTPUT_DIR, 'css'),
    path.join(OUTPUT_DIR, 'js'),
    path.join(OUTPUT_DIR, 'images'),
    path.join(OUTPUT_DIR, 'static')
  ];
  
  dirsToCreate.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Copy static assets to output directory
 */
function copyStaticAssets() {
  // CSS
  const cssDir = path.join(__dirname, '../css');
  if (fs.existsSync(cssDir)) {
    copyDirectory(cssDir, path.join(OUTPUT_DIR, 'css'));
  }
  
  // Images
  const imagesDir = path.join(__dirname, '../images');
  if (fs.existsSync(imagesDir)) {
    copyDirectory(imagesDir, path.join(OUTPUT_DIR, 'images'));
  }
  
  // favicon
  const faviconPath = path.join(__dirname, '../favicon.ico');
  if (fs.existsSync(faviconPath)) {
    fs.copyFileSync(faviconPath, path.join(OUTPUT_DIR, 'favicon.ico'));
  }
  
  // robots.txt if exists
  const robotsPath = path.join(__dirname, '../robots.txt');
  if (fs.existsSync(robotsPath)) {
    fs.copyFileSync(robotsPath, path.join(OUTPUT_DIR, 'robots.txt'));
  }
  
  // .nojekyll for GitHub Pages
  const nojekyllPath = path.join(__dirname, '../.nojekyll');
  if (fs.existsSync(nojekyllPath)) {
    fs.copyFileSync(nojekyllPath, path.join(OUTPUT_DIR, '.nojekyll'));
  }
}

/**
 * Copy directory recursively
 */
function copyDirectory(source, destination) {
  // Create destination if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  // Read all files in source
  const files = fs.readdirSync(source);
  
  // Copy each file
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    // Check if it's a directory
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

/**
 * Create minimal JavaScript utilities
 */
function createJavaScriptUtils() {
  // Create js directory if it doesn't exist
  const jsDir = path.join(OUTPUT_DIR, 'js');
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }
  
  // Create theme toggle JS
  const themeJs = `/**
 * Theme toggle functionality
 */
(function() {
  // Function to set theme
  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
      
      // Update icons
      document.querySelector('.sun-icon').style.display = 'none';
      document.querySelector('.moon-icon').style.display = 'block';
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
      
      // Update icons
      document.querySelector('.sun-icon').style.display = 'block';
      document.querySelector('.moon-icon').style.display = 'none';
    }
  }
  
  // Initialize theme based on preferences
  function initializeTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem('darkMode');
    
    if (storedPreference === 'true' || (prefersDark && storedPreference === null)) {
      setTheme(true);
    } else {
      setTheme(false);
    }
  }
  
  // Setup event listener for theme toggle
  function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        setTheme(!isDarkMode);
      });
    }
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupThemeToggle();
  });
})();`;
  
  fs.writeFileSync(path.join(jsDir, 'theme.js'), themeJs, 'utf8');
}

// Execute the generator
generateStaticSite().catch(err => {
  console.error('Error generating static site:', err);
  process.exit(1);
}); 