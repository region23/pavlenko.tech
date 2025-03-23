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
  .option('-c, --config <path>', 'Path to config file', './config.json')
  .option('-o, --output <directory>', 'Output directory', './dist')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log('Building site...');
      await buildSite({
        configPath: options.config,
        outputDir: options.output,
        verbose: options.verbose
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
  .option('-c, --config <path>', 'Path to config file', './config.json')
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
      'content/posts',
      'templates',
      'css',
      'public'
    ];
    
    dirs.forEach(dir => {
      const dirPath = path.join(targetDir, dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating ${dir} directory`);
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Create default config
    const configPath = path.join(targetDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        site: {
          title: 'My Markdown Blog',
          description: 'A static blog built with markdown-blog-engine',
          language: 'en'
        },
        content: {
          postsPerPage: 5,
          showReadingTime: true
        }
      };
      
      fs.writeFileSync(
        configPath, 
        JSON.stringify(defaultConfig, null, 2)
      );
      console.log('Created default config.json');
    }
    
    // Create sample post
    const samplePostPath = path.join(targetDir, 'content/posts/hello-world.md');
    if (!fs.existsSync(samplePostPath)) {
      const samplePost = `---
title: Hello World
date: ${new Date().toISOString().split('T')[0]}
tags: [hello, blog]
---

# Hello World!

This is your first blog post. Edit it or create a new one in the \`content/posts\` directory.

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
    
    console.log('\nBlog initialized successfully!');
    console.log('\nTo build your blog, run:');
    console.log('  npx blog-engine build');
    console.log('\nTo serve your blog locally, run:');
    console.log('  npx blog-engine serve');
  });

// Parse command line arguments
program.parse(process.argv); 