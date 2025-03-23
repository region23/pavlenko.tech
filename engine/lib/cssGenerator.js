/**
 * CSS Generator Module
 * Generates CSS variables based on config.json appearance settings
 */

const fs = require('fs');
const path = require('path');
const { getConfig } = require('./configManager');

/**
 * Generate CSS variables content from config appearance settings
 * @returns {string} - CSS variables content
 */
function generateCssVariables() {
  const config = getConfig();
  const appearance = config.appearance || {};
  
  let cssVariables = '/**\n * Generated CSS Variables\n * Auto-generated from config.json appearance settings\n */\n\n';
  
  // Add :root variables
  cssVariables += ':root {\n';
  
  // Add color variables
  if (appearance.colors) {
    cssVariables += '  /* Color variables */\n';
    Object.entries(appearance.colors).forEach(([key, value]) => {
      cssVariables += `  --${key}-color: ${value};\n`;
    });
    cssVariables += '\n';
  }
  
  // Add font variables
  if (appearance.fonts) {
    cssVariables += '  /* Font variables */\n';
    if (appearance.fonts.main) {
      cssVariables += `  --font-sans: '${appearance.fonts.main}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n`;
      cssVariables += '    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n';
    }
    
    if (appearance.fonts.code) {
      cssVariables += `  --font-mono: '${appearance.fonts.code}', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;\n`;
    }
    cssVariables += '\n';
  }
  
  // Add standard spacing and other variables
  cssVariables += '  /* Spacing */\n';
  cssVariables += '  --space-xs: 0.5rem;\n';
  cssVariables += '  --space-sm: 1rem;\n';
  cssVariables += '  --space-md: 1.5rem;\n';
  cssVariables += '  --space-lg: 2rem;\n';
  cssVariables += '  --space-xl: 3rem;\n\n';
  
  cssVariables += '  /* Borders */\n';
  cssVariables += '  --radius-sm: 4px;\n';
  cssVariables += '  --radius-md: 8px;\n';
  cssVariables += '  --radius-lg: 12px;\n\n';
  
  cssVariables += '  /* Transitions */\n';
  cssVariables += '  --transition-fast: 0.15s ease;\n';
  cssVariables += '  --transition-normal: 0.3s ease;\n';
  
  cssVariables += '}\n\n';
  
  // Add dark mode variables
  if (appearance.darkMode) {
    cssVariables += '/* Dark mode overrides */\n';
    cssVariables += '.dark-mode {\n';
    
    Object.entries(appearance.darkMode).forEach(([key, value]) => {
      // Map background to background-color, text to text-color, etc.
      const cssVar = key.endsWith('color') ? `--${key}` : `--${key}-color`;
      cssVariables += `  ${cssVar}: ${value};\n`;
    });
    
    cssVariables += '}\n';
  }
  
  return cssVariables;
}

/**
 * Write the generated CSS variables to a file
 * @returns {Promise<void>}
 */
async function writeCssVariables() {
  try {
    const config = getConfig();
    const outputDir = path.join(process.cwd(), 'css', 'components');
    const outputFile = path.join(outputDir, 'variables.css');
    
    // Ensure the directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate the CSS content
    const cssContent = generateCssVariables();
    
    // Write to file
    fs.writeFileSync(outputFile, cssContent);
    console.log('CSS variables written to:', outputFile);
  } catch (error) {
    console.error('Error writing CSS variables:', error);
  }
}

module.exports = {
  generateCssVariables,
  writeCssVariables
}; 