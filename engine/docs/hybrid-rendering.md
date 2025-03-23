# Hybrid Rendering System

This blog uses a hybrid rendering approach that combines the benefits of a Single Page Application (SPA) with static HTML generation for bots and crawlers.

## Overview

### Dynamic SPA for Users
- Regular users get the full SPA experience with smooth page transitions
- Content loads dynamically via JavaScript
- No page reloads when navigating between pages
- Maintains state (like dark mode preference) across navigation

### Static HTML for Crawlers
- Search engines and services like Telegram Instant View get pre-rendered HTML
- Content is immediately available without JavaScript execution
- Critical for services that don't execute JavaScript (like Telegram IV)
- Improves SEO and sharing experience

## How It Works

1. **User Agent Detection**:
   - The server checks if the request is coming from a crawler/bot
   - If it's a regular user, serves the SPA version
   - If it's a bot, serves the static HTML version

2. **Static Generation**:
   - Static HTML pages are pre-generated for all blog posts
   - These pages are stored in `/static/posts/` directory
   - Generated during the build process

3. **Routing Logic**:
   - `.htaccess` rules handle the routing based on user agent
   - Bots are directed to static HTML files
   - Regular users get the SPA experience

## Maintaining the System

### When Adding New Content

Whenever you add a new post or update existing content:

1. Run the build process to update both the index and static files:
   ```bash
   npm run build
   ```

2. This will:
   - Update the content index (`npm run update-index`)
   - Generate static HTML files for all posts (`npm run generate-static`)

3. Deploy the updated content:
   ```bash
   npm run deploy
   ```

### Modifying the Templates

If you change the layout or design of the blog:

1. Update the SPA templates in your JavaScript files
2. Also update the static template in `scripts/generate-static.js`
3. Regenerate all static files with `npm run generate-static`

## Debugging

### Testing Crawler View

To test how crawlers see your site:

1. Use browser developer tools to change your user agent to a crawler
2. Or access the static HTML files directly at `/static/posts/[filename].html`

### Common Issues

- **Inconsistencies Between Versions**: If the static HTML looks different from the SPA version, ensure the templates in `generate-static.js` match your SPA rendering logic
- **Missing Static Files**: Check that `npm run generate-static` is running correctly and creating files in `/static/posts/`
- **Crawler Not Seeing Static HTML**: Verify your `.htaccess` rules are working correctly

## Technical Details

### Static Generator

The static HTML generator:
- Uses the same markdown parsing library as the SPA
- Mirrors the styling and layout of the dynamic version
- Includes proper metadata for SEO and sharing
- Is designed to work without JavaScript

### Hybrid Approach Benefits

This approach gives you the best of both worlds:
- Great user experience with fast, app-like navigation for humans
- SEO and sharing-friendly content for bots
- No complex server-side rendering setup
- Minimalist implementation with just a few files 