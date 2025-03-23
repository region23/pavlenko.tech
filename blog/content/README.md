# Content Directory

This directory is where you store all your blog content. The engine will process files from here when building your site.

## Structure

```
content/
├── posts/            # Your blog posts (required)
│   ├── post1.md
│   └── post2.md
└── about/            # Content for about page (optional)
    └── index.md
```

## Writing Posts

Posts should be written in Markdown format with YAML frontmatter at the top:

```markdown
---
title: "My First Post"
date: "2023-01-15"
tags: ["getting-started", "markdown"]
summary: "A short summary of the post"
---

# Content starts here

Regular markdown content follows...
```

## Frontmatter Fields

| Field    | Required | Description                                      |
|----------|----------|--------------------------------------------------|
| title    | Yes      | Title of the post                                |
| date     | Yes      | Publication date (YYYY-MM-DD format)             |
| tags     | No       | Array of tags for categorization                 |
| summary  | No       | Brief description for listings and meta tags     |
| image    | No       | Featured image path (relative to content folder) |
| draft    | No       | Set to true to exclude from production builds    |

## Images and Assets

You can include images in your posts using standard Markdown syntax:

```markdown
![Image description](../images/my-image.jpg)
```

For organization, you might want to:

1. Place post-specific images in a folder with the same name as your post
2. Use a common images directory for shared assets

## Note About Updates

This content directory is completely separate from the blog engine code. When you update the engine, your content remains untouched. 