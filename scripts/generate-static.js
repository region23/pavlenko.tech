/**
 * Static HTML Generator for Blog Posts
 * 
 * This script generates static HTML snapshots of blog posts for crawlers like Telegram Instant View.
 * It uses the same rendering logic as the browser-based SPA to ensure consistency.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const frontmatter = require('gray-matter');
const { markedSmartypants } = require('marked-smartypants');
const { gfmHeadingId } = require('marked-gfm-heading-id');

// Constants
const CONTENT_DIR = path.join(__dirname, '../content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const OUTPUT_DIR = path.join(__dirname, '../static');
const POSTS_OUTPUT_DIR = path.join(OUTPUT_DIR, 'posts');
const CONFIG_PATH = path.join(__dirname, '../config.json');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}
if (!fs.existsSync(POSTS_OUTPUT_DIR)) {
  fs.mkdirSync(POSTS_OUTPUT_DIR);
}

// Load configuration
let config;
try {
  const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Error loading config:', error);
  process.exit(1);
}

/**
 * Configure Marked renderer similar to the browser version
 */
function configureMarked() {
  // Custom renderer
  const renderer = {
    // Code blocks with syntax highlighting
    code(code, language) {
      return `<pre><code class="language-${language || 'text'}">${code}</code></pre>`;
    },
    
    // Links with proper handling
    link(href, content, title) {
      const titleAttr = title ? ` title="${title}"` : '';
      // External links get target="_blank"
      const targetAttr = typeof href === 'string' && href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${titleAttr}${targetAttr}>${content}</a>`;
    },
    
    // Image handling
    image(href, content, title) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<figure><img src="${href}" alt="${content || ''}"${titleAttr}><figcaption>${content || ''}</figcaption></figure>`;
    }
  };
  
  // Set marked options with обновленным API для marked 15.x
  marked.use({
    renderer: renderer,
    gfm: true,
    breaks: true,
    smartLists: true
  });

  // Добавляем расширения
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
 * Generate HTML template for a blog post
 */
function generatePostHtml(post, htmlContent) {
  const { title, date, tags, author } = post;
  const postAuthor = author || config.content.defaultAuthor;
  const formattedDate = formatDate(date);
  const readingTime = calculateReadingTime(htmlContent);
  
  // Generate tags HTML
  let tagsHtml = '';
  if (tags && tags.length > 0) {
    tagsHtml = `
      <div class="post-tags">
        ${tags.map(tag => `<a href="/tags/${tag}">${tag}</a>`).join('')}
      </div>
    `;
  }
  
  return `<!DOCTYPE html>
<html lang="${config.site.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self' localhost:*;">
  <base href="/">
  <title>${title} | ${config.site.title}</title>
  <meta name="description" content="${post.summary || ''}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  
  <!-- This is a static snapshot for crawlers like Telegram Instant View -->
  <script>
    // Redirect to SPA version for real users
    if (!/bot|telegram|whatsapp|facebook|twitter|linkedin|google|bing|yahoo|duckduckgo|yandex|baidu|spider|crawl|slurp|mediapartners/i.test(navigator.userAgent)) {
      window.location.href = '/#/posts/${post.slug || post.file}';
    }
  </script>
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
            <li><a href="${item.url}" ${item.url === '/' ? 'class="active"' : ''}>${item.label}</a></li>
          `).join('')}
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <article class="post">
        <header class="post-header">
          <h1>${title}</h1>
          <div class="post-meta">
            <time datetime="${date}">${formattedDate}</time>
            ${postAuthor ? `<span class="post-author">${postAuthor}</span>` : ''}
            ${config.content.showReadingTime ? `<span class="reading-time">${readingTime} min read</span>` : ''}
          </div>
          ${tagsHtml}
        </header>
        
        <div class="post-content">
          ${htmlContent}
        </div>
        
        <div class="social-share">
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}&text=${encodeURIComponent(title)}" class="social-button twitter-share" target="_blank" rel="noopener">Share on Twitter</a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}" class="social-button linkedin-share" target="_blank" rel="noopener">Share on LinkedIn</a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(`https://${config.site.hostname || 'pavlenko.tech'}/posts/${post.slug || post.file}`)}&text=${encodeURIComponent(title)}" class="social-button telegram-share" target="_blank" rel="noopener">Share on Telegram</a>
        </div>
      </article>
    </div>
  </main>

  <footer>
    <div class="container">
      <p>${config.site.copyright}</p>
      <div class="footer-links">
        ${config.social.links.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.name}</a>
        `).join('')}
      </div>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Process all posts and generate static HTML files
 */
async function generateStaticPages() {
  console.log('Generating static HTML pages...');
  
  // Configure marked
  configureMarked();
  
  try {
    // Load posts index
    const indexPath = path.join(POSTS_DIR, 'index.json');
    const indexData = fs.readFileSync(indexPath, 'utf8');
    const postsIndex = JSON.parse(indexData);
    
    console.log(`Found ${postsIndex.length} posts in index`);
    
    // Process each post
    for (const post of postsIndex) {
      console.log(`Processing post: ${post.title}`);
      
      // Load the markdown file
      const postFilePath = path.join(POSTS_DIR, `${post.file}.md`);
      
      if (!fs.existsSync(postFilePath)) {
        console.error(`Post file not found: ${postFilePath}`);
        continue;
      }
      
      const fileContent = fs.readFileSync(postFilePath, 'utf8');
      
      // Extract frontmatter and content
      const { content } = frontmatter(fileContent);
      
      // Remove the title from content (it's rendered separately)
      const titleRegex = /^\s*# .+?\n/m;
      const contentWithoutTitle = content.replace(titleRegex, '');
      
      // Render markdown to HTML
      const htmlContent = renderMarkdown(contentWithoutTitle);
      
      // Generate full HTML page
      const fullHtml = generatePostHtml(post, htmlContent);
      
      // Determine output path
      const outputPath = path.join(POSTS_OUTPUT_DIR, `${post.slug || post.file}.html`);
      
      // Write file
      fs.writeFileSync(outputPath, fullHtml);
      console.log(`Generated: ${outputPath}`);
    }
    
    console.log('Static page generation complete!');
  } catch (error) {
    console.error('Error generating static pages:', error);
    process.exit(1);
  }
}

// Run the generator
generateStaticPages(); 