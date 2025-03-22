/**
 * Content Processor
 * Handles loading and processing markdown content
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');
const slugify = require('slugify');
const { markedSmartypants } = require('marked-smartypants');
const { gfmHeadingId } = require('marked-gfm-heading-id');

// Configure marked with proper settings and extensions
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

// Call configuration function
configureMarked();

class ContentProcessor {
  constructor(contentDir, outputDir, config = {}) {
    this.contentDir = contentDir;
    this.outputDir = outputDir;
    this.postsDir = path.join(contentDir, 'posts');
    this.pagesDir = path.join(contentDir, 'pages');
    this.imagesDir = path.join(contentDir, 'images');
    this.config = {
      title: 'Pavlenko.Tech',
      description: 'Авторский блог Павла Павленко про разработку и AI',
      baseUrl: 'https://',
      author: 'Pavel Pavlenko',
      hostname: 'pavlenko.tech',
      postsPerPage: 5,
      navigation: {
        items: [
          { text: 'Home', url: '/' },
          { text: 'Tags', url: '/tags/' },
          { text: 'About', url: '/about/' }
        ]
      },
      social: {
        links: [
          { platform: 'GitHub', url: 'https://github.com/pavlenko', icon: 'github' },
          { platform: 'Twitter', url: 'https://twitter.com/pavlenko', icon: 'twitter' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/in/pavlenko', icon: 'linkedin' }
        ]
      },
      ...config
    };
    
    this.posts = [];
    this.pages = {};
    this.tags = {};
  }

  /**
   * Process all content
   */
  async processContent() {
    console.log('Processing content...');
    await this.loadPosts();
    await this.generatePages();
    await this.generateTagPages();
    await this.generateSitemap();
    
    // Create a general data object for the header and footer
    this.pages['/'] = {
      ...this.pages['/'],
      navigation: this.config.navigation,
      social: this.config.social
    };
    
    // Add navigation and social data to all pages
    for (const url in this.pages) {
      this.pages[url] = {
        ...this.pages[url],
        navigation: this.config.navigation, 
        social: this.config.social
      };
    }
    
    return {
      posts: this.posts,
      pages: this.pages,
      tags: this.tags
    };
  }

  /**
   * Load and process all posts
   */
  async loadPosts() {
    const postsDir = path.join(this.contentDir, 'posts');
    const postFiles = fs.readdirSync(postsDir)
      .filter(file => file.endsWith('.md'));

    this.posts = await Promise.all(postFiles.map(async file => {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { attributes, body } = frontMatter(content);
      
      // Create slug from filename or title
      const slug = attributes.slug || 
        slugify(path.basename(file, '.md'), { lower: true, strict: true });
      
      // Parse markdown to HTML
      const html = marked.parse(body);
      
      // Extract excerpt (first paragraph or specified excerpt)
      const excerpt = attributes.excerpt || 
        html.match(/<p>(.*?)<\/p>/)?.[1] || '';
      
      // Calculate reading time
      const wordCount = body.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
      
      // Format date
      const date = attributes.date ? new Date(attributes.date) : new Date();
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Build the post URL
      const url = `/posts/${slug}`;
      
      // Process tags
      const tags = attributes.tags || [];
      
      // Add post to tags index
      tags.forEach(tag => {
        if (!this.tags[tag]) {
          this.tags[tag] = {
            name: tag,
            posts: []
          };
        }
        this.tags[tag].posts.push({ slug, title: attributes.title, url });
      });
      
      return {
        title: attributes.title || 'Untitled Post',
        slug,
        date: formattedDate,
        isoDate: date.toISOString(),
        author: attributes.author || this.config.defaultAuthor,
        tags,
        excerpt,
        content: html,
        readingTime,
        url
      };
    }));
    
    // Sort posts by date (newest first)
    this.posts.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
    
    // Add next/previous links
    this.posts.forEach((post, index) => {
      if (index > 0) {
        post.nextPost = {
          title: this.posts[index - 1].title,
          url: this.posts[index - 1].url
        };
      }
      
      if (index < this.posts.length - 1) {
        post.previousPost = {
          title: this.posts[index + 1].title,
          url: this.posts[index + 1].url
        };
      }
    });
    
    console.log(`Processed ${this.posts.length} posts`);
  }

  /**
   * Generate static pages for posts and index
   */
  async generatePages() {
    // Process individual post pages
    await Promise.all(this.posts.map(async post => {
      this.pages[post.url] = {
        template: 'pages/post.html',
        post,  // Make post directly available in the template
        title: post.title,
        data: {
          site: this.config,
          post,
          title: post.title
        }
      };
    }));
    
    // Generate paginated index pages
    const postsPerPage = this.config.postsPerPage || 10;
    const totalPages = Math.ceil(this.posts.length / postsPerPage);
    
    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      const pageSlug = page === 1 ? '/' : `/page/${page}`;
      
      const pagination = {
        currentPage: page,
        totalPages,
        prevPage: page > 1 ? (page === 2 ? '/' : `/page/${page - 1}`) : null,
        nextPage: page < totalPages ? `/page/${page + 1}` : null
      };
      
      this.pages[pageSlug] = {
        template: 'pages/home.html',
        posts: this.posts.slice(startIndex, endIndex), // Make posts directly available in the template
        pagination, // Make pagination directly available in the template
        title: page === 1 ? 'Home' : `Page ${page}`,
        data: {
          site: this.config,
          title: page === 1 ? 'Home' : `Page ${page}`,
          posts: this.posts.slice(startIndex, endIndex),
          pagination
        }
      };
    }
  }

  /**
   * Generate tag pages
   */
  async generateTagPages() {
    // Generate individual tag pages
    for (const [tagName, tag] of Object.entries(this.tags)) {
      const tagSlug = slugify(tagName, { lower: true, strict: true });
      const url = `/tags/${tagSlug}`;
      
      // Ensure posts have all required fields
      const tagPosts = tag.posts.map(postSummary => {
        // Find the full post data
        const fullPost = this.posts.find(p => p.slug === postSummary.slug);
        return {
          ...postSummary,
          date: fullPost ? fullPost.date : new Date().toLocaleDateString(),
          author: fullPost ? fullPost.author : this.config.defaultAuthor,
          readingTime: fullPost ? fullPost.readingTime : '?',
          excerpt: fullPost ? fullPost.excerpt : ''
        };
      });
      
      const tagData = {
        name: tagName,
        posts: tagPosts,
        pagination: null // Pagination for tag pages if needed
      };
      
      this.pages[url] = {
        template: 'pages/tag.html',
        tag: tagData, // Make tag directly available in the template
        posts: tagPosts, // Make posts directly available in the template
        title: `Тег: ${tagName}`,
        data: {
          site: this.config,
          title: `Тег: ${tagName}`,
          tag: tagData
        }
      };
    }
    
    // Generate tags index page
    const sortedTags = Object.entries(this.tags)
      .map(([name, tag]) => ({
        name,
        count: tag.posts.length,
        url: `/tags/${slugify(name, { lower: true, strict: true })}`
      }))
      .sort((a, b) => b.count - a.count);
    
    this.pages['/tags'] = {
      template: 'pages/tags.html',
      data: {
        site: this.config,
        title: 'Tags',
        tags: sortedTags
      }
    };
    
    // Add about page
    if (fs.existsSync(path.join(this.contentDir, 'about.md'))) {
      const aboutContent = fs.readFileSync(path.join(this.contentDir, 'about.md'), 'utf8');
      const { attributes, body } = frontMatter(aboutContent);
      const html = marked.parse(body);
      
      this.pages['/about'] = {
        template: 'pages/about.html',
        data: {
          site: this.config,
          title: attributes.title || 'About',
          content: html
        }
      };
    }
    
    // 404 page
    this.pages['/404'] = {
      template: 'pages/404.html',
      data: {
        site: this.config,
        title: '404 - Page Not Found'
      }
    };
  }

  /**
   * Generate a sitemap.xml file
   */
  async generateSitemap() {
    const baseUrl = `https://${this.config.hostname}`;
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add each page to sitemap
    Object.entries(this.pages).forEach(([url, page]) => {
      // Skip 404 page
      if (url === '/404') return;
      
      const fullUrl = `${baseUrl}${url}`;
      sitemap += '  <url>\n';
      sitemap += `    <loc>${fullUrl}</loc>\n`;
      
      // Add lastmod for posts
      if (url.startsWith('/posts/') && page.data.post && page.data.post.isoDate) {
        sitemap += `    <lastmod>${page.data.post.isoDate}</lastmod>\n`;
      }
      
      sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(this.outputDir, 'sitemap.xml'), sitemap);
    console.log('Generated sitemap.xml');
  }

  /**
   * Get all pages to be generated
   */
  getPages() {
    return this.pages;
  }
}

module.exports = ContentProcessor; 