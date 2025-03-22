# Static Blog Generator

A modern, lightweight static blog with a powerful configuration system, allowing customization without editing code.

## Features

- Fully configurable through a single `config.json` file
- Static site generation for fast loading and best SEO practices
- Responsive design for mobile and desktop
- Dark mode support
- Tag-based categorization
- Markdown content with code highlighting
- Automatic reading time calculation
- Configurable appearance (colors, fonts, etc.)
- Automatic pagination based on config settings
- Sitemap.xml generation for better SEO
- Lightning-fast performance with minimal JavaScript

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

## Configuration

The blog is fully customizable through the `config.json` file. You can modify the following settings:

### Site Configuration

```json
"site": {
  "title": "Your Blog Title",
  "description": "Your blog description here",
  "language": "en",
  "copyright": "© 2025 Your Name",
  "hostname": "your-domain.com"
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

This blog now uses a static site generation approach:

1. All content is written in Markdown with frontmatter
2. The static generator processes Markdown content and generates HTML files
3. Pagination is pre-rendered based on the `postsPerPage` setting in the config
4. A minimal amount of JavaScript is included for:
   - Dark mode toggle
   - Optional interactive elements
5. All pages are generated as static HTML, resulting in:
   - Faster page loads
   - Better SEO
   - Improved security
   - Lower hosting costs

## Automated Deployment

The blog includes GitHub Actions configuration for automatic deployment:

1. Commit and push your changes to the main branch
2. GitHub Actions will build the static site
3. The built site will be deployed to GitHub Pages

You can customize the deployment in the `.github/workflows/build-deploy.yml` file.

## Customization

For advanced customization beyond the configuration file, you can:

1. Edit the CSS in `css/style.css`
2. Modify the static site generator in `scripts/static-site-generator.js`
3. Update the JavaScript in the `js` folder

## License

MIT 