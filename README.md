# Static Blog Generator

A modern, lightweight static blog with a powerful configuration system and hybrid rendering approach. Supports both client-side SPA (Single Page Application) and static HTML generation for improved SEO and Telegram Instant View compatibility.

## Features

- Fully configurable through a single `config.json` file
- Hybrid rendering: SPA for users, static HTML for bots and SEO
- Custom template engine with variables, conditionals, loops, and template inheritance
- Automatic post-processing of HTML to clean up unprocessed template tags
- Static site generation for fast loading and best SEO practices
- Responsive design for mobile and desktop
- Dark mode support
- Tag-based categorization with dedicated tag pages
- Markdown content with code highlighting and typographic improvements
- Table of contents generation from article headings
- Automatic reading time calculation
- Configurable appearance (colors, fonts, etc.)
- Automatic pagination based on config settings
- Telegram Instant View 2.1 integration
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
- `npm run generate-static` - Generate the static site using the site-generator.js
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

This blog uses a hybrid approach combining SPA and static site generation:

1. All content is written in Markdown with frontmatter
2. The static generator processes Markdown content and generates HTML files using:
   - A custom template engine that handles variables, conditions, loops, and template inheritance
   - Marked 15.x with extensions (smartypants for typography, gfm-heading-id for heading anchors)
   - Post-processing to clean up any unprocessed template tags
3. Pagination is pre-rendered based on the `postsPerPage` setting in the config
4. HTML pages are generated for:
   - Individual posts
   - Home page with paginated post lists
   - Tag pages with filtered post lists
   - About and 404 pages
5. The `.htaccess` file intelligently routes search engines and bots to static HTML versions
6. For regular users, the SPA version provides a smooth experience with client-side routing
7. Telegram Instant View is supported through a custom IV 2.1 template

## Template Engine

The blog uses a custom template engine with the following features:

- Template variables: `{{ variable }}`
- Conditional statements: `{% if condition %}...{% else %}...{% endif %}`
- Loops: `{% for item in items %}...{% endfor %}`
- Template inclusion: `{% include "partial.html" %}`
- Template inheritance: `{% extends "layout.html" %}`
- Safe property access to prevent errors with undefined variables

## Directory Structure

```
/
├── content/             # Content files in Markdown
├── css/                 # CSS stylesheets
├── dist/                # Generated static site
├── js/                  # Client-side JavaScript
├── scripts/             # Build scripts
├── src/
│   ├── engine/          # Static site generator components
│   │   ├── template.js  # Template engine
│   │   └── content.js   # Content processor
│   └── templates/       # HTML templates
│       ├── layouts/     # Base layouts
│       ├── pages/       # Page templates
│       └── partials/    # Reusable components
├── static/              # Static assets
└── config.json          # Site configuration
```

## Automated Deployment

The blog includes GitHub Actions configuration for automatic deployment:

1. Commit and push your changes to the main branch
2. GitHub Actions will build the static site
3. The built site will be deployed to GitHub Pages

You can customize the deployment in the `.github/workflows/build-deploy.yml` file.

## Telegram Instant View

The blog includes a custom Telegram Instant View 2.1 template that works with both the SPA and static HTML versions. To test the template:

1. Upload the `telegram-iv-template.txt` file to the [Telegram IV Platform](https://instantview.telegram.org/)
2. Test it against your blog posts
3. Submit for approval when ready

## Known Limitations

- Template conditions with undefined variables may generate errors in the console (these are handled by post-processing)
- All static HTML files need to be regenerated when templates are modified
- Certain complex elements (iframe, canvas) are not fully supported in Telegram Instant View

## Roadmap

Upcoming features and improvements:

- Full overhaul of template condition handling to eliminate undefined variable errors
- Integration with Google Analytics (optional via config)
- Improved SEO with sitemap.xml and robots.txt
- Comment system integration (Disqus, Utterances)
- Admin panel for visual configuration editing
- Enhanced image optimization
- Expanded Markdown capabilities with custom components
- Automatic TOC generation from article headings
- Multi-language UI support

## Customization

For advanced customization beyond the configuration file, you can:

1. Edit the CSS in `css/style.css`
2. Modify the static site generator in `scripts/site-generator.js`
3. Update the templates in the `src/templates` directory
4. Extend the template engine in `src/engine/template.js`

## License

MIT 