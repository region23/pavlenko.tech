/**
 * Template Engine
 * A simple template engine that supports variables, conditionals, loops, includes, and layouts
 */

const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor(templatesDir) {
    this.templatesDir = templatesDir;
    this.cache = new Map();
  }

  /**
   * Loads a template from file
   * @param {string} templatePath - Path to template relative to templates directory
   * @returns {string} - Template content
   */
  loadTemplate(templatePath) {
    const fullPath = path.join(this.templatesDir, templatePath);
    
    // Check cache first
    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }
    
    try {
      const template = fs.readFileSync(fullPath, 'utf8');
      this.cache.set(fullPath, template);
      return template;
    } catch (error) {
      throw new Error(`Failed to load template '${templatePath}': ${error.message}`);
    }
  }

  /**
   * Renders a template with the provided data
   * @param {string} templatePath - Path to template relative to templates directory
   * @param {Object} data - Data to use for rendering
   * @returns {string} - Rendered HTML
   */
  render(templatePath, data) {
    const template = this.loadTemplate(templatePath);
    return this.renderString(template, data, { filename: templatePath });
  }

  /**
   * Renders a template string with the provided data
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @param {Object} options - Render options
   * @returns {string} - Rendered HTML
   */
  renderString(template, data, options = {}) {
    // Ensure data is an object
    const safeData = data || {};
    
    // Process extends/layouts
    template = this.processExtends(template, safeData, options);
    
    // Process includes
    template = this.processIncludes(template, safeData, options);
    
    // Process conditionals
    template = this.processConditionals(template, safeData);
    
    // Process loops
    template = this.processLoops(template, safeData);
    
    // Process variables
    template = this.processVariables(template, safeData);
    
    return template;
  }

  /**
   * Process {% extends 'layout.html' %} directive
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @param {Object} options - Render options
   * @returns {string} - Processed template
   */
  processExtends(template, data, options) {
    const extendsRegex = /{% extends ['"](.+)['"] %}/;
    const match = template.match(extendsRegex);
    
    if (!match) return template;
    
    const layoutPath = match[1];
    const layout = this.loadTemplate(layoutPath);
    
    // Extract blocks from the template
    const blocks = {};
    const blockRegex = /{% block (\w+) %}([\s\S]*?){% endblock %}/g;
    
    let blockMatch;
    while ((blockMatch = blockRegex.exec(template)) !== null) {
      blocks[blockMatch[1]] = blockMatch[2];
    }
    
    // Replace block placeholders in the layout
    let result = layout;
    Object.keys(blocks).forEach(blockName => {
      const blockRegex = new RegExp(`{% block ${blockName} %}[\\s\\S]*?{% endblock %}`, 'g');
      result = result.replace(blockRegex, blocks[blockName]);
    });
    
    // Process the layout itself (recursively for nested layouts)
    return this.processExtends(result, data, { filename: layoutPath });
  }

  /**
   * Process {% include 'partial.html' %} directives
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @param {Object} options - Render options
   * @returns {string} - Processed template
   */
  processIncludes(template, data, options) {
    const includeRegex = /{% include ['"](.+)['"] %}/g;
    
    return template.replace(includeRegex, (match, includePath) => {
      const partialTemplate = this.loadTemplate(includePath);
      // Process the included template but don't process layouts
      return this.renderString(partialTemplate, data, { filename: includePath });
    });
  }

  /**
   * Process {% if condition %}...{% endif %} directives
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @returns {string} - Processed template
   */
  processConditionals(template, data) {
    const conditionalRegex = /{% if (.+?) %}([\s\S]*?)(?:{% else %}([\s\S]*?))?{% endif %}/g;
    
    return template.replace(conditionalRegex, (match, condition, ifContent, elseContent = '') => {
      let result;
      
      try {
        // Check if condition is a simple variable existence check
        if (/^\w+$/.test(condition.trim())) {
          result = data[condition.trim()] ? ifContent : elseContent;
        } else {
          // Safer condition evaluation for complex conditions
          const safeCondition = this.makeSafeCondition(condition);
          const evalResult = this.evaluateCondition(safeCondition, data);
          result = evalResult ? ifContent : elseContent;
        }
      } catch (error) {
        console.error(`Error evaluating condition "${condition}":`, error);
        result = elseContent; // Default to else content on error
      }
      
      return result;
    });
  }

  /**
   * Make a condition safe for evaluation
   * @param {string} condition - Original condition
   * @returns {string} - Safe condition
   */
  makeSafeCondition(condition) {
    // Replace logical operators with JavaScript operators
    condition = condition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
    return condition;
  }

  /**
   * Evaluate a condition safely
   * @param {string} condition - Condition to evaluate
   * @param {Object} data - Data context
   * @returns {boolean} - Evaluation result
   */
  evaluateCondition(condition, data) {
    try {
      // Replace all property chains with optional chaining
      // Example: tag.pagination.nextPage becomes tag?.pagination?.nextPage
      const safeCondition = this.transformPropertyAccessToOptionalChaining(condition);
      
      // Create a function that has the data object as its scope
      // and applies optional chaining to property accesses
      const fn = new Function(...Object.keys(data), `
        try {
          // Undefined variables or properties will be 'undefined' and not throw errors
          return Boolean(${safeCondition});
        } catch (e) {
          // Just return false on any errors without stopping the generation process
          console.warn('Condition evaluation error for: ${condition.replace(/'/g, "\\'")}', e.message);
          return false;
        }
      `);
      
      // Call the function with the data values
      return fn(...Object.values(data));
    } catch (error) {
      console.warn(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * Transform property chains to use optional chaining
   * @param {string} condition - Original condition
   * @returns {string} - Condition with optional chaining
   */
  transformPropertyAccessToOptionalChaining(condition) {
    // First, replace logical operators
    condition = condition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
    
    // Match property chains like 'tag.pagination.nextPage' but not 'tag.method()' or strings
    const dotNotationRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(\.[a-zA-Z_$][a-zA-Z0-9_$]*)+\b/g;
    
    // Replace with optional chaining
    return condition.replace(dotNotationRegex, (match) => {
      // Replace each dot with the ?. operator
      return match.replace(/\./g, '?.');
    });
  }

  /**
   * Process {% for item in items %}...{% endfor %} directives
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @returns {string} - Processed template
   */
  processLoops(template, data) {
    const loopRegex = /{% for (\w+) in (\w+) %}([\s\S]*?){% endfor %}/g;
    
    return template.replace(loopRegex, (match, itemVar, itemsVar, content) => {
      const items = data[itemsVar];
      
      if (!items || !Array.isArray(items)) {
        return '';
      }
      
      return items.map(item => {
        // Create a new data object with the loop variable
        const loopData = { ...data, [itemVar]: item };
        // Process nested constructs
        return this.renderString(content, loopData);
      }).join('');
    });
  }

  /**
   * Process {{ variable }} directives
   * @param {string} template - Template string
   * @param {Object} data - Data to use for rendering
   * @returns {string} - Processed template
   */
  processVariables(template, data) {
    const variableRegex = /{{ *([^{}]+?) *}}/g;
    
    return template.replace(variableRegex, (match, variable) => {
      try {
        // Extract pipes for filters
        const parts = variable.split('|').map(part => part.trim());
        let value = parts[0];
        
        // Handle nested properties (e.g., user.name)
        value = value.split('.').reduce((obj, prop) => {
          if (obj === undefined || obj === null) return '';
          return obj[prop];
        }, data);
        
        // Apply filters
        for (let i = 1; i < parts.length; i++) {
          const filterParts = parts[i].split(':');
          const filterName = filterParts[0];
          
          if (filterName === 'encodeURIComponent' && value !== undefined) {
            value = encodeURIComponent(value);
          }
        }
        
        return value !== undefined && value !== null ? String(value) : '';
      } catch (error) {
        console.error(`Error processing variable "${variable}":`, error);
        return '';
      }
    });
  }

  /**
   * Clears the template cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = TemplateEngine; 