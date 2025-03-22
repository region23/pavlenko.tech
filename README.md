# Configurable Static Blog

A modern, lightweight static blog with a powerful configuration system, allowing customization without editing code.

## Features

- Fully configurable through a single `config.json` file
- Responsive design for mobile and desktop
- Dark mode support
- Tag-based categorization
- Markdown content with code highlighting
- Automatic reading time calculation
- Configurable appearance (colors, fonts, etc.)
- Telegram Instant View support for fast article reading in Telegram
- Hybrid rendering system (SPA for users, static HTML for crawlers)

## Getting Started

1. Clone this repository
2. Customize `config.json` file
3. Add your blog posts to the `posts` folder in Markdown format
4. Run `npm run build` to generate static files
5. Serve the blog using your preferred static hosting (GitHub Pages, Netlify, Vercel, etc.)

## Configuration

The blog is fully customizable through the `config.json` file. You can modify the following settings:

### Site Configuration

```json
"site": {
  "title": "Your Blog Title",
  "description": "Your blog description here",
  "language": "en",
  "copyright": "© 2025 Your Name"
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
      "name": "GitHub",
      "url": "https://github.com/yourusername"
    },
    {
      "name": "Twitter",
      "url": "https://twitter.com/yourusername"
    },
    {
      "name": "LinkedIn",
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

Create Markdown files in the `posts` folder with the following frontmatter:

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

## Development

To run the blog locally:

```bash
# Using a simple HTTP server
npx http-server

# Or with Python
python -m http.server
```

## Customization

For advanced customization beyond the configuration file, you can:

1. Edit the CSS in `css/style.css`
2. Modify the JavaScript in the `js` folder
3. Update the HTML structure in `index.html`

## Hybrid Rendering

This blog uses a hybrid rendering approach that combines:

- A dynamic Single Page Application (SPA) for human visitors
- Pre-rendered static HTML for crawlers and bots

This provides the best user experience for regular users while ensuring compatibility with services like Telegram Instant View and search engines.

See the detailed documentation in [docs/hybrid-rendering.md](docs/hybrid-rendering.md) to learn:

1. How the hybrid system works
2. How to maintain static files
3. How to test and debug

## Telegram Instant View

This blog includes Telegram Instant View support, allowing users to read your articles directly in the Telegram app with zero loading time.

### Setting Up Instant View

See the detailed instructions in [docs/telegram-instant-view.md](docs/telegram-instant-view.md) to:

1. Set up an Instant View template for your blog
2. Test and publish your template
3. Share articles with Instant View links

The Telegram share button is already included with each blog post for easy sharing.

## License

MIT 