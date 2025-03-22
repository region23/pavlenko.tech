#!/usr/bin/env node

/**
 * Скрипт для генерации index.json на основе Markdown-файлов в директории posts
 * Использование: node generate-index.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readDirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Путь к директории с постами
const POSTS_DIR = path.join(__dirname, '../content/posts');
// Путь к файлу индекса
const INDEX_FILE = path.join(POSTS_DIR, 'index.json');

/**
 * Извлечение метаданных из frontmatter в Markdown-файле
 * @param {string} content - Содержимое файла
 * @returns {Object} - Объект с метаданными
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match || match.length < 2) {
    return {};
  }
  
  const frontmatterText = match[1];
  const result = {};
  
  // Разбираем YAML-подобный формат
  frontmatterText.split('\n').forEach(line => {
    const colonPos = line.indexOf(':');
    
    if (colonPos !== -1) {
      const key = line.slice(0, colonPos).trim();
      let value = line.slice(colonPos + 1).trim();
      
      // Убираем кавычки, если они есть
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Обработка массивов в формате [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          // Пытаемся разобрать как JSON
          result[key] = JSON.parse(value);
        } catch (e) {
          // Если не получилось как JSON, разбираем вручную
          const items = value.slice(1, -1).split(',');
          result[key] = items.map(item => {
            item = item.trim();
            // Убираем кавычки у элементов массива
            if ((item.startsWith('"') && item.endsWith('"')) || 
                (item.startsWith("'") && item.endsWith("'"))) {
              return item.slice(1, -1);
            }
            return item;
          });
        }
      } else {
        result[key] = value;
      }
    }
  });
  
  return result;
}

/**
 * Генерация индекса постов
 */
async function generateIndex() {
  try {
    console.log('Начинаем генерацию index.json...');
    
    // Получаем список файлов в директории posts
    const files = await readDirAsync(POSTS_DIR);
    
    // Фильтруем только .md файлы
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`Найдено ${markdownFiles.length} markdown-файлов`);
    
    // Обрабатываем каждый файл
    const postsMetadata = await Promise.all(
      markdownFiles.map(async (filename) => {
        const filePath = path.join(POSTS_DIR, filename);
        const stat = await statAsync(filePath);
        
        // Пропускаем директории
        if (stat.isDirectory()) {
          return null;
        }
        
        try {
          // Читаем содержимое файла
          const content = await readFileAsync(filePath, 'utf8');
          
          // Извлекаем метаданные из frontmatter
          const metadata = extractFrontmatter(content);
          
          // Добавляем имя файла и слаг, если они не указаны
          const fileBase = path.basename(filename, '.md');
          
          return {
            ...metadata,
            file: fileBase,
            slug: metadata.slug || fileBase
          };
        } catch (error) {
          console.error(`Ошибка при обработке файла ${filename}:`, error);
          return null;
        }
      })
    );
    
    // Убираем null-значения и сортируем по дате (новые сначала)
    const validPosts = postsMetadata
      .filter(post => post !== null)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      });
    
    // Записываем индекс в файл
    await writeFileAsync(INDEX_FILE, JSON.stringify(validPosts, null, 2), 'utf8');
    
    console.log(`Индекс успешно сгенерирован! Обработано ${validPosts.length} статей.`);
  } catch (error) {
    console.error('Ошибка при генерации индекса:', error);
    process.exit(1);
  }
}

// Запускаем генерацию индекса
generateIndex(); 