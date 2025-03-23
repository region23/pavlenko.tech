#!/usr/bin/env node

/**
 * Blog Engine CLI
 * Command-line interface for the Markdown Blog Engine
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { buildSite } = require('../lib/index');

// Get package version
const packageJson = require('../package.json');

program
  .name('blog-engine')
  .description('Markdown blog engine CLI')
  .version(packageJson.version);

program
  .command('build')
  .description('Build static site from markdown content')
  .option('-c, --config <path>', 'Path to config file', './blog/config.json')
  .option('-o, --output <directory>', 'Output directory', './dist')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --debug', 'Show debug information')
  .action(async (options) => {
    try {
      console.log('Building site...');
      
      if (options.debug) {
        console.log('Debug info:');
        console.log(`- Current working directory: ${process.cwd()}`);
        console.log(`- Config path: ${path.resolve(options.config)}`);
        console.log(`- Output directory: ${path.resolve(options.output)}`);
        
        // Check if config file exists
        try {
          fs.accessSync(options.config, fs.constants.R_OK);
          console.log(`- Config file exists and is readable`);
        } catch (err) {
          console.log(`- Config file does not exist or is not readable: ${err.message}`);
        }
      }
      
      await buildSite({
        configPath: options.config,
        outputDir: options.output,
        verbose: options.verbose,
        debug: options.debug
      });
      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Build and serve the site locally')
  .option('-p, --port <number>', 'Port to serve on', '3000')
  .option('-c, --config <path>', 'Path to config file', './blog/config.json')
  .option('-o, --output <directory>', 'Output directory', './dist')
  .action(async (options) => {
    try {
      // First build the site
      await buildSite({
        configPath: options.config,
        outputDir: options.output
      });
      
      // Then serve it using npx serve
      const { spawn } = require('child_process');
      const serve = spawn('npx', ['serve', options.output, '-p', options.port], {
        stdio: 'inherit'
      });
      
      console.log(`Serving site on http://localhost:${options.port}`);
      
      // Handle process termination
      process.on('SIGINT', () => {
        serve.kill();
        process.exit(0);
      });
    } catch (error) {
      console.error('Failed to serve site:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new blog project')
  .option('-d, --directory <path>', 'Project directory', '.')
  .action((options) => {
    const targetDir = path.resolve(options.directory);
    
    // Check if directory exists
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Initialize project structure
    const dirs = [
      'blog/content/posts',
      'blog/content/about',
      'blog/templates',
      'blog/css',
      'blog/images'
    ];
    
    dirs.forEach(dir => {
      const dirPath = path.join(targetDir, dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating ${dir} directory`);
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Copy default files from engine/defaults
    console.log('Copying default files to blog directory...');
    
    // Copy config.json
    const configPath = path.join(targetDir, 'blog/config.json');
    if (!fs.existsSync(configPath)) {
      fs.copyFileSync(
        path.join(__dirname, '../defaults/config.json'),
        configPath
      );
      console.log('Copied default config.json');
    }
    
    // Copy default templates
    const templatesDir = path.join(targetDir, 'blog/templates');
    const defaultTemplatesDir = path.join(__dirname, '../defaults/templates');
    fs.readdirSync(defaultTemplatesDir).forEach(file => {
      const targetPath = path.join(templatesDir, file);
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(
          path.join(defaultTemplatesDir, file),
          targetPath
        );
      }
    });
    console.log('Copied default templates');
    
    // Copy default CSS files
    const cssDir = path.join(targetDir, 'blog/css');
    const defaultCssDir = path.join(__dirname, '../defaults/css');
    
    // Create CSS directory if it doesn't exist
    if (!fs.existsSync(cssDir)) {
      fs.mkdirSync(cssDir, { recursive: true });
    }
    
    // Copy CSS files from defaults
    fs.readdirSync(defaultCssDir).forEach(file => {
      // Only copy .css files
      if (file.endsWith('.css')) {
        const targetPath = path.join(cssDir, file);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(
            path.join(defaultCssDir, file),
            targetPath
          );
        }
      }
    });
    console.log('Copied default CSS files');
    
    // Copy default images
    const imagesDir = path.join(targetDir, 'blog/images');
    const defaultImagesDir = path.join(__dirname, '../defaults/images');
    fs.readdirSync(defaultImagesDir).forEach(file => {
      const targetPath = path.join(imagesDir, file);
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(
          path.join(defaultImagesDir, file),
          targetPath
        );
      }
    });
    console.log('Copied default images');
    
    // Create Telegram IV template
    const telegramTemplatePath = path.join(targetDir, 'blog/telegram-iv-template.txt');
    if (!fs.existsSync(telegramTemplatePath)) {
      const telegramTemplate = `# Telegram Instant View Template
      
# This template allows Telegram to create Instant View pages for your blog
# More info: https://instantview.telegram.org/

~version: "2.1"

# Article detection
?path: /posts/.+
body: //main
title: //h1

# Content
cover: //figure[has-class("post-cover")]//img
author: $author
published_date: $date
kicker: //p[has-class("post-summary")]
channel: $site_title

# Cleanup
@remove: //aside
@remove: //footer
@remove: //header

# Image handling
image_url: $srcset_largest_image
`;
      
      fs.writeFileSync(telegramTemplatePath, telegramTemplate);
      console.log('Created Telegram Instant View template');
    }
    
    // Create sample post
    const samplePostPath = path.join(targetDir, 'blog/content/posts/hello-world.md');
    if (!fs.existsSync(samplePostPath)) {
      const samplePost = `---
title: Hello World
date: ${new Date().toISOString().split('T')[0]}
tags: [hello, blog]
---

# Hello World!

This is your first blog post. Edit it or create a new one in the \`blog/content/posts\` directory.

## Markdown Support

This blog engine supports all standard Markdown features.

- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- And more!
`;
      
      fs.writeFileSync(samplePostPath, samplePost);
      console.log('Created sample blog post');
    }
    
    // Create sample about page
    const aboutDirPath = path.join(targetDir, 'blog/content/about');
    const aboutPagePath = path.join(aboutDirPath, 'index.md');
    if (!fs.existsSync(aboutPagePath)) {
      const aboutPage = `---
title: About This Blog
---

# About This Blog

This is an about page. Edit it to tell your readers about yourself and your blog.

## About Me

Write something about yourself here.

## Contact

- Email: your.email@example.com
- Twitter: @yourhandle
`;
      
      fs.writeFileSync(aboutPagePath, aboutPage);
      console.log('Created sample about page');
    }
    
    // Update package.json or create if it doesn't exist
    const packageJsonPath = path.join(targetDir, 'package.json');
    let packageJson = {};
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (error) {
        console.warn('Could not parse existing package.json, creating new one');
      }
    }
    
    // Add/update necessary fields
    packageJson.name = packageJson.name || 'my-markdown-blog';
    packageJson.version = packageJson.version || '1.0.0';
    packageJson.description = packageJson.description || 'My blog built with markdown-blog-engine';
    
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.dev = 'blog-engine serve';
    packageJson.scripts.build = 'blog-engine build';
    packageJson.scripts.deploy = 'npm run build && echo "Deploy command goes here"';
    
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['markdown-blog-engine'] = '^1.0.0';
    
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );
    console.log('Updated package.json');
    
    console.log('\nBlog initialized successfully!');
    console.log('\nTo build your blog, run:');
    console.log('  npm run build');
    console.log('\nTo serve your blog locally, run:');
    console.log('  npm run dev');
  });

// Parse command line arguments
program.parse(process.argv); 