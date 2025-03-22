# Telegram Instant View Integration

This guide explains how to set up [Telegram Instant View 2.1](https://instantview.telegram.org/) for your blog. Instant View allows Telegram users to read your articles in a clean, fast-loading format directly in the Telegram app.

## What is Instant View?

Telegram Instant View provides a clean reading experience for articles shared in Telegram:

- Zero loading time
- Consistent formatting
- Works even with slow connections
- No ads or clutter
- Optimized for mobile devices
- Rich media support

## Setup Instructions

### 1. Requirements

- A Telegram account
- Access to the [Instant View Editor](https://instantview.telegram.org/)
- Understanding of the IV 2.1 template format

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
   - Images load properly with captions (if they have alt text)
   - Related articles (tags) display properly

### 4. IV 2.1 Features

Our template uses the following Instant View 2.1 features:

- **Site name:** Specifies the site name for proper attribution
- **Description:** Extracts article summary for link previews
- **Cover images:** Displays featured images as cover
- **Figure captions:** Preserves image alt text as captions
- **Related articles:** Shows tag links as related content
- **RTL support:** Commented code for right-to-left languages (if needed)
- **Unsupported content marking:** Properly flags content that can't be rendered in IV

### 5. Customization Options

#### Telegram Channel Link

If you have a Telegram channel, uncomment and update the following line in the template:

```
#channel: https://t.me/pavlenkodev
```

This adds a "Join Channel" button to your Instant View pages.

#### Cover Image

If your articles typically have a featured image, the template is already set to use the first image in the article as the cover. You can modify this selector if needed:

```
@if_exists: //article[contains(@class, "post")]//img[1]
cover: //article[contains(@class, "post")]//img[1]
@end
```

### 6. Publishing the Template

You have two options for making your Instant View template available:

#### Option A: For Your Use Only

Generate `t.me/iv?url=...&rhash=...` links with your template hash and share those on your Telegram channel or with your audience.

1. After finalizing your template, click "View in Telegram"
2. Copy the resulting URL which contains your template hash
3. Share these custom URLs when posting your articles

#### Option B: Public Template

Submit your template for approval by Telegram's team:

1. Complete the "Track Changes" process to ensure your template works across various articles
2. Click "Submit Template" in the Instant View Editor
3. Wait for Telegram's approval (may take several days to a week)
4. Once approved, anyone sharing links to your blog in Telegram will see the Instant View button

## Perfect Template Checklist

Before submitting your template, review Telegram's [Perfect Template Checklist](https://instantview.telegram.org/checklist#perfect-templates) to ensure your template is ready for approval:

1. ✅ Uses Instant View 2.1
2. ✅ Handles all article types on your blog correctly
3. ✅ Properly marks unsupported content
4. ✅ Maintains proper headings hierarchy (h1, h2, h3, etc.)
5. ✅ Preserves image captions and attribution
6. ✅ Properly formats code blocks
7. ✅ Displays related articles through tags
8. ✅ Includes proper site_name

## Adding Share Links to Your Blog

To encourage sharing your articles with Instant View, add a Telegram share button to your blog posts (already implemented):

```javascript
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
4. **Version mismatch**: Ensure your template specifies version 2.1 features and syntax

## Resources

- [Instant View Documentation](https://instantview.telegram.org/docs)
- [Perfect Template Checklist](https://instantview.telegram.org/checklist#perfect-templates)
- [Template Language Reference](https://instantview.telegram.org/docs#instant-view-format-reference) 