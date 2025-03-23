/**
 * Template Engine Module
 * Handles HTML template loading and rendering for the static site generator
 */

const fs = require('fs');
const path = require('path');

// Template cache to improve performance
const templateCache = {};

/**
 * Load a template file and cache it
 * @param {string} templateName - Name of the template file without extension
 * @returns {string} - Template content
 */
function loadTemplate(templateName) {
  const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
  
  // Return from cache if available
  if (templateCache[templatePath]) {
    return templateCache[templatePath];
  }
  
  try {
    const template = fs.readFileSync(templatePath, 'utf-8');
    templateCache[templatePath] = template;
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return ''; // Return empty string on error
  }
}

/**
 * Replace variables in template with actual values
 * @param {string} template - Template string with variables
 * @param {Object} data - Data object with values to replace variables
 * @returns {string} - Processed template with variables replaced
 */
function processTemplate(template, data) {
  // Simple variable replacement using regex
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    key = key.trim();
    return data[key] !== undefined ? data[key] : '';
  });
}

/**
 * Generate the base HTML structure
 * @param {Object} options - Template options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.content - Main content HTML
 * @param {Object} options.config - Site configuration
 * @param {Object} options.meta - Additional meta information
 * @returns {string} - Complete HTML document
 */
function generatePage({ title, description, content, config, meta = {} }) {
  // Load base template
  const baseTemplate = loadTemplate('base');
  
  // Generate header and footer
  const header = generateHeader(config);
  const footer = generateFooter(config);
  
  // Prepare data for template
  const data = {
    language: config.site.language || 'ru-RU',
    site_title: config.site.title,
    title_prefix: title ? `${title} | ` : '',
    description: description || config.site.description,
    canonical: meta.canonical ? `<link rel="canonical" href="${meta.canonical}">` : '',
    header: header,
    content: content,
    footer: footer
  };
  
  // Process template with data
  return processTemplate(baseTemplate, data);
}

/**
 * Generate the header HTML
 * @param {Object} config - Site configuration
 * @returns {string} - Header HTML
 */
function generateHeader(config) {
  // Load header template
  const headerTemplate = loadTemplate('header');
  
  // Prepare data for template
  const data = {
    site_title: config.site.title
  };
  
  // Process template with data
  return processTemplate(headerTemplate, data);
}

/**
 * Generate the footer HTML
 * @param {Object} config - Site configuration
 * @returns {string} - Footer HTML
 */
function generateFooter(config) {
  // Load footer template
  const footerTemplate = loadTemplate('footer');
  
  // Prepare data for template
  const data = {
    current_year: new Date().getFullYear(),
    site_title: config.site.title
  };
  
  // Process template with data
  return processTemplate(footerTemplate, data);
}

/**
 * Generate HTML for a blog post
 * @param {Object} post - Post data
 * @param {Object} config - Site configuration
 * @returns {string} - Post HTML content
 */
function generatePostContent(post, config) {
  // Load post template
  const postTemplate = loadTemplate('post');
  
  // Generate tags HTML
  const tags = post.tags && post.tags.length > 0 ? generateTagsList(post.tags) : '';
  
  // Prepare data for template
  const data = {
    title: post.title,
    date: post.date,
    formatted_date: post.formattedDate,
    reading_time: post.readingTime ? `<span class="reading-time">${post.readingTime} мин. чтения</span>` : '',
    tags: tags,
    content: post.html
  };
  
  // Process template with data
  return processTemplate(postTemplate, data);
}

/**
 * Generate HTML for post card (used in listings)
 * @param {Object} post - Post data
 * @returns {string} - Post card HTML
 */
function generatePostCard(post) {
  // Load post-card template
  const postCardTemplate = loadTemplate('post-card');
  
  // Generate tags HTML
  const tags = post.tags && post.tags.length > 0 ? generateTagsList(post.tags) : '';
  
  // Prepare data for template
  const data = {
    url: post.url,
    title: post.title,
    date: post.date,
    formatted_date: post.formattedDate,
    reading_time: post.readingTime ? `<span class="reading-time">${post.readingTime} мин. чтения</span>` : '',
    tags: tags,
    summary: post.summary ? `<p class="post-summary">${post.summary}</p>` : ''
  };
  
  // Process template with data
  return processTemplate(postCardTemplate, data);
}

/**
 * Generate HTML for tags list
 * @param {Array} tags - Array of tags
 * @returns {string} - Tags HTML
 */
function generateTagsList(tags) {
  if (!tags || tags.length === 0) return '';
  
  // Load tags template
  const tagsTemplate = loadTemplate('tags');
  
  // Generate individual tag links
  const tagLinks = tags.map(tag => 
    `<a href="/tags/${encodeURIComponent(tag)}/" class="tag">${tag}</a>`
  ).join('');
  
  // Prepare data for template
  const data = {
    tag_links: tagLinks
  };
  
  // Process template with data
  return processTemplate(tagsTemplate, data);
}

/**
 * Generate pagination HTML
 * @param {Object} pagination - Pagination data
 * @param {number} pagination.currentPage - Current page number
 * @param {number} pagination.totalPages - Total number of pages
 * @param {string} pagination.basePath - Base path for pagination links
 * @returns {string} - Pagination HTML
 */
function generatePagination({ currentPage, totalPages, basePath }) {
  if (totalPages <= 1) return '';
  
  // Load pagination template
  const paginationTemplate = loadTemplate('pagination');
  
  // Previous page link
  let prevLink;
  if (currentPage > 1) {
    const prevUrl = currentPage === 2 ? basePath : `${basePath}page/${currentPage - 1}/`;
    prevLink = `<a href="${prevUrl}" class="pagination-item pagination-prev">← Предыдущая</a>`;
  } else {
    prevLink = '<span class="pagination-item pagination-prev disabled">← Предыдущая</span>';
  }
  
  // Calculate range of pages to show
  const range = 2;
  let startPage = Math.max(1, currentPage - range);
  let endPage = Math.min(totalPages, currentPage + range);
  
  // Ensure we always show at least 5 pages if available
  if (endPage - startPage < 4 && totalPages > 4) {
    if (startPage === 1) {
      endPage = Math.min(startPage + 4, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(endPage - 4, 1);
    }
  }
  
  // Page number links
  let pageLinks = '';
  
  // First page link if not in range
  if (startPage > 1) {
    pageLinks += `<a href="${basePath}" class="pagination-item">1</a>`;
    if (startPage > 2) {
      pageLinks += '<span class="pagination-ellipsis">...</span>';
    }
  }
  
  // Page links
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      pageLinks += `<span class="pagination-item pagination-current">${i}</span>`;
    } else {
      const pageUrl = i === 1 ? basePath : `${basePath}page/${i}/`;
      pageLinks += `<a href="${pageUrl}" class="pagination-item">${i}</a>`;
    }
  }
  
  // Last page link if not in range
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageLinks += '<span class="pagination-ellipsis">...</span>';
    }
    pageLinks += `<a href="${basePath}page/${totalPages}/" class="pagination-item">${totalPages}</a>`;
  }
  
  // Next page link
  let nextLink;
  if (currentPage < totalPages) {
    nextLink = `<a href="${basePath}page/${currentPage + 1}/" class="pagination-item pagination-next">Следующая →</a>`;
  } else {
    nextLink = '<span class="pagination-item pagination-next disabled">Следующая →</span>';
  }
  
  // Prepare data for template
  const data = {
    prev_link: prevLink,
    page_links: pageLinks,
    next_link: nextLink
  };
  
  // Process template with data
  return processTemplate(paginationTemplate, data);
}

module.exports = {
  generatePage,
  generateHeader,
  generateFooter,
  generatePostContent,
  generatePostCard,
  generateTagsList,
  generatePagination,
  loadTemplate,
  processTemplate
}; 