/**
 * Markdown Processor Module
 * Handles markdown parsing, rendering, and frontmatter extraction
 */

const { marked } = require('marked');
const frontmatter = require('gray-matter');
const { markedSmartypants } = require('marked-smartypants');
const { gfmHeadingId } = require('marked-gfm-heading-id');

/**
 * Configure Marked renderer with standard options
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
 * Extract frontmatter and content from markdown file
 * @param {string} content - Raw markdown content
 * @returns {Object} - Object with frontmatter data and content
 */
function extractFrontmatter(content) {
  try {
    const { content: markdownContent, data } = frontmatter(content);
    return { content: markdownContent, data };
  } catch (error) {
    console.error('Error extracting frontmatter:', error);
    return { content, data: {} };
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

// Initialize Marked configuration
configureMarked();

module.exports = {
  renderMarkdown,
  extractFrontmatter,
  calculateReadingTime,
  formatDate
}; 