# Migration Guide

This document provides guidance for updating your blog from one version of the markdown-blog-engine to another.

## Updating Between Minor Versions

For minor version updates (e.g., 1.0.0 to 1.1.0), the engine is designed to handle configuration changes automatically through its migration system. Simply update the engine package:

```bash
npm update markdown-blog-engine
```

Then rebuild your site:

```bash
npm run build
```

The engine will automatically:
1. Detect your existing configuration version
2. Migrate settings to the new format if needed
3. Preserve all your customizations

## Major Version Updates (e.g., 1.x.x to 2.0.0)

Major version updates may include breaking changes. Always refer to the release notes before updating. 

### From 1.x to 2.0 (Example)

1. Update the package:
   ```bash
   npm install markdown-blog-engine@2.0.0
   ```

2. Update your templates:
   - 2.0 uses a new placeholder syntax for conditionals
   - Change `{{#if value}}` to `{{if value}}`
   - Change `{{/if}}` to `{{endif}}`

3. Update your configuration:
   - The `site.language` format has changed from simple codes to full locale strings
   - Change `"language": "en"` to `"language": "en-US"`

## Preserving User Content During Updates

Your content and customizations are always preserved during updates because they are kept separate from the engine code:

- ✅ `content/` directory - Contains your posts
- ✅ `templates/` directory - Contains your custom templates
- ✅ `css/` directory - Contains your custom styles
- ✅ `config.json` - Contains your site configuration

These files are never modified by the engine update process. The engine reads these files but never overwrites them.

## Configuration Schema Versioning

The engine uses configuration versioning to ensure backward compatibility:

1. Each configuration has a `_version` property
2. When loading your config, the engine detects the version
3. If needed, it automatically migrates settings to the current format
4. The migrated configuration preserves all your customizations

## Troubleshooting Updates

If you encounter issues after updating:

1. Check that your templates match the expected format for the engine version
2. Verify your configuration file is valid JSON
3. Look for error messages in the build output
4. Check the release notes for breaking changes

For further assistance, refer to the documentation or open an issue on GitHub. 