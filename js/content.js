/**
 * Модуль для загрузки и обработки контента в формате Markdown
 */

// Импортируем marked из CDN
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Настройка библиотеки marked
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Преобразование переводов строк
  headerIds: true, // Генерация ID для заголовков
  langPrefix: 'language-', // CSS-класс для блоков кода
});

// Кэш для контента
const contentCache = new Map();

/**
 * Загрузка списка контента из директории
 * @param {string} directory - Путь к директории с контентом
 * @returns {Promise<Array>} - Промис, разрешающийся массивом элементов контента
 */
async function fetchContentList(directory) {
  // Проверяем кэш
  const cacheKey = `list:${directory}`;
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey);
  }

  try {
    // Загружаем index.json из директории с контентом
    const response = await fetch(`${directory}/index.json`);
    
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
    }
    
    const contentIndex = await response.json();
    const result = contentIndex.map(item => ({
      ...item,
      path: `${directory}/${item.file || item.slug || ''}.md`
    }));
    
    // Сохраняем в кэш
    contentCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Ошибка при загрузке списка контента из ${directory}:`, error);
    return [];
  }
}

/**
 * Загрузка содержимого Markdown-файла
 * @param {string} path - Путь к файлу
 * @returns {Promise<string>} - Промис, разрешающийся содержимым файла
 */
async function fetchContent(path) {
  // Проверяем кэш
  if (contentCache.has(path)) {
    return contentCache.get(path);
  }
  
  try {
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`Файл не найден: ${path} (${response.status})`);
    }
    
    const content = await response.text();
    
    // Сохраняем в кэш
    contentCache.set(path, content);
    return content;
  } catch (error) {
    console.error(`Ошибка при загрузке файла ${path}:`, error);
    return null;
  }
}

/**
 * Очистка кэша контента
 * @param {string} [path] - Опциональный путь для очистки конкретного элемента кэша
 */
function clearContentCache(path) {
  if (path) {
    contentCache.delete(path);
  } else {
    contentCache.clear();
  }
}

/**
 * Обработка frontmatter в Markdown-файле
 * @param {string} content - Содержимое Markdown-файла
 * @returns {Object} - Объект с метаданными из frontmatter и контентом
 */
function processFrontmatter(content) {
  if (!content) return { content: '' };
  
  // Шаблон для поиска frontmatter (данные между --- в начале файла)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match || match.length < 2) {
    return { content };
  }
  
  const frontmatterText = match[1];
  const result = {};
  
  // Парсим YAML-подобный формат
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
          // Используем JSON.parse для корректной обработки
          value = JSON.parse(value.replace(/'/g, '"'));
        } catch (e) {
          // Если не удалось распарсить как JSON, делаем простое разделение
          value = value.slice(1, -1).split(',').map(item => item.trim());
        }
      }
      
      result[key] = value;
    }
  });
  
  // Добавляем очищенный контент без frontmatter
  result.content = content.replace(frontmatterRegex, '');
  
  return result;
}

/**
 * Преобразование Markdown в HTML
 * @param {string} markdown - Markdown-текст
 * @returns {Promise<string>} - Промис, разрешающийся HTML-кодом
 */
async function renderMarkdown(markdown) {
  if (!markdown) return '';
  
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error('Ошибка при преобразовании Markdown:', error);
    return `<p class="error">Ошибка обработки Markdown</p><pre>${markdown}</pre>`;
  }
}

// Экспортируем публичные функции
export {
  fetchContentList,
  fetchContent,
  processFrontmatter,
  renderMarkdown,
  clearContentCache
}; 