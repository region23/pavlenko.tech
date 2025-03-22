#!/usr/bin/env node

/**
 * Скрипт для генерации index.json на основе Markdown-файлов в директории posts
 * Использование: node generate-index.js
 */

const fs = require('fs');
const path = require('path');
const { extractFrontmatter } = require('./lib/markdownProcessor');
const { readFile, writeFile, listFiles } = require('./lib/fileHandler');
const { loadConfig, getConfig } = require('./lib/configManager');

// Скрипт может работать до завершения инициализации конфигурации
const POSTS_DIR = path.join(__dirname, '../content/posts');
const INDEX_FILE = path.join(POSTS_DIR, 'index.json');

/**
 * Генерация индекса постов
 */
async function generateIndex() {
  try {
    console.log('Начинаем генерацию index.json...');
    
    // Загружаем конфигурацию
    await loadConfig();
    const config = getConfig();
    const POSTS_DIR = config.paths.postsDir;
    const INDEX_FILE = path.join(POSTS_DIR, 'index.json');
    
    // Получаем список файлов в директории posts
    const files = await listFiles(POSTS_DIR, '.md');
    
    console.log(`Найдено ${files.length} markdown-файлов`);
    
    // Обрабатываем каждый файл
    const postsMetadata = await Promise.all(
      files.map(async (filename) => {
        // Пропускаем файл index.md если он существует
        if (filename === 'index.md') return null;
        
        try {
          const filePath = path.join(POSTS_DIR, filename);
          const content = await readFile(filePath);
          
          // Извлекаем метаданные из frontmatter
          const { data } = extractFrontmatter(content);
          
          // Проверяем наличие необходимых полей
          if (!data.title || !data.date) {
            console.warn(`Предупреждение: Отсутствуют обязательные поля в ${filename}`);
            
            // Если отсутствует дата, используем дату модификации файла
            if (!data.date) {
              const stats = fs.statSync(filePath);
              data.date = stats.mtime.toISOString().slice(0, 10);
            }
            
            // Если отсутствует заголовок, используем имя файла
            if (!data.title) {
              data.title = filename.replace('.md', '').replace(/-/g, ' ');
            }
          }
          
          // Формируем объект с метаданными
          return {
            file: filename.replace('.md', ''),
            title: data.title,
            date: data.date,
            tags: data.tags || [],
            summary: data.summary || ''
          };
        } catch (error) {
          console.error(`Ошибка обработки файла ${filename}:`, error);
          return null;
        }
      })
    );
    
    // Фильтруем null значения
    const validPosts = postsMetadata.filter(post => post !== null);
    
    // Сортируем по дате (от новых к старым)
    validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`Обработано ${validPosts.length} валидных записей`);
    
    // Записываем индекс в JSON файл
    await writeFile(INDEX_FILE, JSON.stringify(validPosts, null, 2));
    
    console.log(`Файл индекса успешно создан: ${INDEX_FILE}`);
    
    return validPosts;
  } catch (error) {
    console.error('Ошибка создания индекса:', error);
    process.exit(1);
  }
}

// Если файл запущен напрямую (не импортирован)
if (require.main === module) {
  generateIndex();
}

module.exports = { generateIndex }; 