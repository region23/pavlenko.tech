/**
 * Template Engine Module
 * Handles HTML template generation for the static site generator
 */

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
  return `<!DOCTYPE html>
<html lang="${config.site.language || 'ru-RU'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ? `${title} | ` : ''}${config.site.title}</title>
  <meta name="description" content="${description || config.site.description}">
  ${meta.canonical ? `<link rel="canonical" href="${meta.canonical}">` : ''}
  <link rel="stylesheet" href="/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
</head>
<body>
  ${generateHeader(config)}
  <main class="container">
    ${content}
  </main>
  ${generateFooter(config)}
  <script src="/js/theme.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
</body>
</html>`;
}

/**
 * Generate the header HTML
 * @param {Object} config - Site configuration
 * @returns {string} - Header HTML
 */
function generateHeader(config) {
  return `<header>
  <nav class="container">
    <div class="logo">
      <a href="/">${config.site.title}</a>
    </div>
    <div class="nav-links">
      <a href="/about/" class="nav-link">Обо мне</a>
      <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </div>
  </nav>
</header>`;
}

/**
 * Generate the footer HTML
 * @param {Object} config - Site configuration
 * @returns {string} - Footer HTML
 */
function generateFooter(config) {
  const year = new Date().getFullYear();
  return `<footer>
  <div class="container">
    <div class="footer-content">
      <p>&copy; ${year} ${config.site.title}</p>
    </div>
  </div>
</footer>`;
}

/**
 * Generate HTML for a blog post
 * @param {Object} post - Post data
 * @param {Object} config - Site configuration
 * @returns {string} - Post HTML content
 */
function generatePostContent(post, config) {
  return `
  <article class="post">
    <header class="post-header">
      <h1>${post.title}</h1>
      <div class="post-meta">
        <time datetime="${post.date}">${post.formattedDate}</time>
        ${post.readingTime ? `<span class="reading-time">${post.readingTime} мин. чтения</span>` : ''}
      </div>
      ${generateTagsList(post.tags)}
    </header>
    <div class="post-content">
      ${post.html}
    </div>
  </article>`;
}

/**
 * Generate HTML for post card (used in listings)
 * @param {Object} post - Post data
 * @returns {string} - Post card HTML
 */
function generatePostCard(post) {
  return `
  <article class="post-card">
    <h2><a href="${post.url}">${post.title}</a></h2>
    <div class="post-meta">
      <time datetime="${post.date}">${post.formattedDate}</time>
      ${post.readingTime ? `<span class="reading-time">${post.readingTime} мин. чтения</span>` : ''}
    </div>
    ${generateTagsList(post.tags)}
    ${post.summary ? `<p class="post-summary">${post.summary}</p>` : ''}
  </article>`;
}

/**
 * Generate HTML for tags list
 * @param {Array} tags - Array of tags
 * @returns {string} - Tags HTML
 */
function generateTagsList(tags) {
  if (!tags || tags.length === 0) return '';
  
  const tagLinks = tags.map(tag => 
    `<a href="/tags/${encodeURIComponent(tag)}/" class="tag">${tag}</a>`
  ).join('');
  
  return `<div class="tags">${tagLinks}</div>`;
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
  
  let paginationHtml = '<div class="pagination">';
  
  // Previous page link
  if (currentPage > 1) {
    const prevUrl = currentPage === 2 ? basePath : `${basePath}page/${currentPage - 1}/`;
    paginationHtml += `<a href="${prevUrl}" class="pagination-item pagination-prev">← Предыдущая</a>`;
  } else {
    paginationHtml += '<span class="pagination-item pagination-prev disabled">← Предыдущая</span>';
  }
  
  // Page number links
  paginationHtml += '<div class="pagination-numbers">';
  
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
  
  // First page link if not in range
  if (startPage > 1) {
    paginationHtml += `<a href="${basePath}" class="pagination-item">1</a>`;
    if (startPage > 2) {
      paginationHtml += '<span class="pagination-ellipsis">...</span>';
    }
  }
  
  // Page links
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHtml += `<span class="pagination-item pagination-current">${i}</span>`;
    } else {
      const pageUrl = i === 1 ? basePath : `${basePath}page/${i}/`;
      paginationHtml += `<a href="${pageUrl}" class="pagination-item">${i}</a>`;
    }
  }
  
  // Last page link if not in range
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHtml += '<span class="pagination-ellipsis">...</span>';
    }
    paginationHtml += `<a href="${basePath}page/${totalPages}/" class="pagination-item">${totalPages}</a>`;
  }
  
  paginationHtml += '</div>';
  
  // Next page link
  if (currentPage < totalPages) {
    paginationHtml += `<a href="${basePath}page/${currentPage + 1}/" class="pagination-item pagination-next">Следующая →</a>`;
  } else {
    paginationHtml += '<span class="pagination-item pagination-next disabled">Следующая →</span>';
  }
  
  paginationHtml += '</div>';
  
  return paginationHtml;
}

module.exports = {
  generatePage,
  generateHeader,
  generateFooter,
  generatePostContent,
  generatePostCard,
  generateTagsList,
  generatePagination
}; 