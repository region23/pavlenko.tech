# Telegram Instant View Integration

This guide explains how to set up [Telegram Instant View](https://instantview.telegram.org/) for your blog. Instant View allows Telegram users to read your articles in a clean, fast-loading format directly in the Telegram app.

## What is Instant View?

Telegram Instant View provides a clean reading experience for articles shared in Telegram:

- Zero loading time
- Consistent formatting
- Works even with slow connections
- No ads or clutter
- Optimized for mobile devices

## Setup Instructions

### 1. Requirements

- A Telegram account
- Access to the [Instant View Editor](https://instantview.telegram.org/)

### 2. Using the Template

1. Go to [instantview.telegram.org](https://instantview.telegram.org/) and log in with your Telegram account
2. Click on "My Templates" and then "Create New Template"
3. Enter the URL of your blog (e.g., `https://pavlenko.tech`)
4. Copy the contents of `telegram-iv-template.txt` from this repository
5. Paste it into the template editor
6. Test your template with various article URLs from your blog

### 3. Testing the Template

1. In the Instant View Editor, enter the URL of one of your blog posts
2. The editor will show:
   - The original page (left panel)
   - Your template code (middle panel)
   - The resulting Instant View page (right panel)
3. Verify that:
   - The title is correctly extracted
   - Author and date information is present
   - The article content displays properly
   - Code blocks are formatted correctly
   - Images load properly

### 4. Customization Options

#### Telegram Channel Link

If you have a Telegram channel, uncomment and update the following line in the template:

```
#channel: https://t.me/pavlenkodev
```

This adds a "Join Channel" button to your Instant View pages.

#### Cover Image

If your articles typically have a featured image, uncomment and adjust the cover image selector:

```
#cover: //article[contains(@class, "post")]//img[1]
```

### 5. Publishing the Template

You have two options for making your Instant View template available:

#### Option A: For Your Use Only

Generate `t.me/iv?url=...&rhash=...` links with your template hash and share those on your Telegram channel or with your audience.

1. After finalizing your template, click "View in Telegram"
2. Copy the resulting URL which contains your template hash
3. Share these custom URLs when posting your articles

#### Option B: Public Template

Submit your template for approval by Telegram's team:

1. Click "Submit Template" in the Instant View Editor
2. Wait for Telegram's approval (may take several days)
3. Once approved, anyone sharing links to your blog in Telegram will see the Instant View button

## Adding Share Links to Your Blog

To encourage sharing your articles with Instant View, add a Telegram share button to your blog posts:

```javascript
// Add this code to your share buttons section in js/ui.js
const telegramButton = createElement('a', {
  href: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`,
  className: 'social-button telegram-share',
  target: '_blank',
  rel: 'noopener'
}, 'Share on Telegram');

shareSection.appendChild(telegramButton);
```

## Troubleshooting

If your Instant View template isn't working as expected:

1. **Content not displaying correctly**: Check your selectors and make sure they match the HTML structure of your blog
2. **Images not loading**: Verify the image path replacements in the template
3. **Template rejected**: Review Telegram's [checklist](https://instantview.telegram.org/checklist) for template requirements

## Resources

- [Instant View Documentation](https://instantview.telegram.org/docs)
- [Instant View Checklist](https://instantview.telegram.org/checklist)
- [Template Guide](https://instantview.telegram.org/guide) 