# Static Blog Generator

A modern, lightweight static blog with a modular architecture, high performance, and a powerful configuration system, allowing customization without editing code.

## Features

- Fully configurable through a single `config.json` file
- Modular architecture with clean separation of concerns
- Efficient caching system for markdown rendering and file operations
- Static site generation for fast loading and best SEO practices
- Responsive design for mobile and desktop
- Dark mode support
- Tag-based categorization
- Markdown content with code highlighting
- Automatic reading time calculation
- Table of contents generation
- Configurable appearance (colors, fonts, etc.)
- Automatic pagination based on config settings
- Sitemap.xml generation for better SEO
- Lightning-fast performance with minimal JavaScript

## Architecture

The project follows a modular architecture with clear separation of concerns:

- **markdownProcessor.js** - Handles markdown parsing, frontmatter extraction, and rendering
- **fileHandler.js** - Manages all file system operations with efficient caching
- **configManager.js** - Handles configuration loading, validation, and schema checking
- **templateEngine.js** - Provides flexible HTML template rendering
- **siteBuilder.js** - Orchestrates the site building process

## Getting Started

1. Clone this repository
2. Customize `config.json` file
3. Add your blog posts to the `content/posts` folder in Markdown format
4. Run `npm run build` to generate static files
5. The generated static site will be in the `dist` folder
6. Serve the blog using your preferred static hosting (GitHub Pages, Netlify, Vercel, etc.)

## Scripts

- `npm run start` - Serve the generated static site locally
- `npm run dev` - Generate the site and serve it locally for development
- `npm run update-index` - Update the post index file
- `npm run generate-static` - Generate the static site
- `npm run build` - Update the index and generate the static site
- `npm run deploy` - Build, commit and push to GitHub (triggers automatic deployment)
- `npm run test` - Run the test script to verify the functionality of all modules

## Configuration

The blog is fully customizable through the `config.json` file. You can modify the following settings:

### Site Configuration

```json
"site": {
  "title": "Your Blog Title",
  "description": "Your blog description here",
  "language": "en",
  "copyright": "© 2025 Your Name",
  "url": "https://your-domain.com"
}
```

### Navigation

```json
"navigation": {
  "items": [
    {
      "label": "Blog",
      "url": "/"
    },
    {
      "label": "Tags",
      "url": "/tags"
    },
    {
      "label": "About",
      "url": "/about"
    }
  ]
}
```

### Social Links

```json
"social": {
  "links": [
    {
      "platform": "GitHub",
      "url": "https://github.com/yourusername"
    },
    {
      "platform": "Twitter",
      "url": "https://twitter.com/yourusername"
    },
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/yourusername"
    }
  ]
}
```

### Appearance

```json
"appearance": {
  "colors": {
    "primary": "#3f51b5",
    "secondary": "#ff4081",
    "accent": "#00bcd4",
    "background": "#ffffff",
    "surface": "#f5f5f5",
    "text": "#212121",
    "border": "#e0e0e0"
  },
  "darkMode": {
    "background": "#121212",
    "surface": "#1e1e1e",
    "text": "#ffffff",
    "border": "#333333"
  },
  "fonts": {
    "main": "Inter",
    "code": "JetBrains Mono"
  }
}
```

### Content Settings

```json
"content": {
  "postsPerPage": 10,
  "showReadingTime": true,
  "defaultAuthor": "Your Name",
  "wordsPerMinute": 200
}
```

### Advanced Module Configuration

You can also configure the individual modules:

```json
"markdown": {
  "cacheRendering": true,
  "readingTime": {
    "wordsPerMinute": 200,
    "minMinutes": 1
  },
  "dateFormat": {
    "locale": "en-US",
    "options": {
      "year": "numeric",
      "month": "long",
      "day": "numeric"
    }
  }
},
"templates": {
  "cacheTemplates": true,
  "templatesDir": "templates"
},
"files": {
  "enableCache": true,
  "cacheTTL": 60000
}
```

## Blog Post Format

Create Markdown files in the `content/posts` folder with the following frontmatter:

```markdown
---
title: "Your Post Title"
date: "2025-01-01"
tags: ["tag1", "tag2"]
author: "Author Name" # Optional, defaults to config.defaultAuthor
summary: "A brief summary of your post"
---

Your post content in Markdown format...
```

## How It Works

This blog uses an optimized static site generation approach:

1. All content is written in Markdown with frontmatter
2. The `configManager` loads and validates the site configuration
3. The `markdownProcessor` renders Markdown content to HTML with caching for improved performance
4. The `templateEngine` handles HTML template rendering with component-based approach
5. The `fileHandler` manages all file operations with caching and parallel processing
6. The `siteBuilder` orchestrates the whole process, generating:
   - Home page with pagination
   - Individual post pages
   - Tag pages
   - About page
   - 404 error page
   - Sitemap.xml

The generated static site offers:
- Faster page loads
- Better SEO
- Improved security
- Lower hosting costs

## Performance Optimizations

The codebase includes several performance optimizations:

1. **Caching System:**
   - Markdown rendering results are cached
   - Frequently accessed files are cached
   - Templates are cached for repeated use

2. **Parallel Processing:**
   - Multiple site sections are built in parallel
   - File operations use Promise.all for concurrency

3. **Efficient File Operations:**
   - Native Node.js APIs for optimal performance
   - Smart detection of file changes

4. **Reduced Code Duplication:**
   - Reusable components and functions
   - Centralized error handling

## Testing

The project includes a test script to verify the functionality of all modules:

```
npm run test
```

This will run a complete site build with verbose logging to ensure all components work correctly together.

## Customization

For advanced customization beyond the configuration file, you can:

1. Edit the CSS in `css/style.css`
2. Modify the templates in the `templates` folder
3. Extend the static site generator modules in `scripts/lib`

## License

MIT 