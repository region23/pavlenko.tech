/**
 * Модуль для загрузки и обработки контента в формате Markdown
 */

// Импортируем marked из локального файла вместо CDN
import { marked } from "./lib/marked.esm.js";

// Функция для экранирования HTML
function escapeHTML(text) {
  // Убедимся, что text - это строка
  if (text === null || text === undefined) {
    return '';
  }
  
  // Преобразуем в строку, если это не строка
  const str = typeof text !== 'string' ? String(text) : text;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Полная настройка marked с корректной обработкой блоков кода
marked.setOptions({
  gfm: true,                // GitHub Flavored Markdown
  breaks: true,             // Преобразование переводов строк
  headerIds: false,         // Отключаем генерацию id для заголовков
  mangle: false,            // Отключаем обработку ссылок в заголовках
  smartLists: true,         // Улучшенные списки
  smartypants: true,        // Типографские символы
  xhtml: false,             // HTML5 (не XHTML)
});

// Пользовательский рендерер
const renderer = {
  // Переопределяем метод для рендеринга кода
  code(code, language) {
    // Защита от null или undefined
    if (code === null || code === undefined) {
      code = '';
    }
    
    // Преобразуем в строку, если это не строка
    if (typeof code !== 'string') {
      code = String(code);
    }
    
    // JavaScript-код может содержать шаблонные строки с ${}, 
    // которые могут вызывать проблемы при рендеринге
    if (language === 'javascript' || language === 'js') {
      // Экранируем особо проблемные последовательности отдельно
      code = code.replace(/\${/g, '\\${');
    }
    
    const escapedCode = escapeHTML(code);
    const langClass = language ? ` class="language-${language}"` : '';
    return `<pre><code${langClass}>${escapedCode}</code></pre>`;
  },
  
  // Переопределяем метод для codespan (код внутри текста)
  codespan(code) {
    // Защита от null или undefined
    if (code === null || code === undefined) {
      code = '';
    }
    
    // Преобразуем в строку, если это не строка
    if (typeof code !== 'string') {
      code = String(code);
    }
    
    return `<code>${escapeHTML(code)}</code>`;
  }
};

// Применяем наш рендерер
marked.use({ renderer });

// Кэш для контента
const contentCache = new Map();

/**
 * Загрузка списка контента из директории
 * @param {string} directory - Путь к директории с контентом (по умолчанию: 'content/posts')
 * @returns {Promise<Array>} - Промис, разрешающийся массивом элементов контента
 */
async function fetchContentList(directory = 'content/posts') {
  console.log(`Запрос на загрузку списка контента из ${directory}`);
  
  // Максимальное количество попыток
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Добавляем параметр для предотвращения кэширования
      const url = `${directory}/index.json?nocache=${Date.now()}`;
      console.log(`Запрос к URL: ${url} (попытка ${retries + 1}/${maxRetries})`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке списка контента: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Проверяем, что данные имеют правильный формат
      if (!Array.isArray(data)) {
        throw new Error('Неверный формат данных: ожидался массив');
      }
      
      // Обрабатываем данные и добавляем slug к каждому элементу если его нет
      const processedData = data.map(item => {
        // Если slug не задан, создаем его из имени файла
        if (!item.slug && item.path) {
          const pathParts = item.path.split('/');
          const filename = pathParts[pathParts.length - 1];
          item.slug = filename.replace(/\.md$/, '');
        }
        
        // Для совместимости добавляем file если его нет
        if (!item.file && item.path) {
          const pathParts = item.path.split('/');
          item.file = pathParts[pathParts.length - 1];
        }
        
        return item;
      });
      
      // Сортируем посты по дате (сначала новые)
      processedData.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
      
      console.log(`Успешно загружено ${processedData.length} элементов контента`);
      return processedData;
    } catch (error) {
      retries++;
      console.error(`Ошибка при загрузке контента (попытка ${retries}/${maxRetries}):`, error);
      
      if (retries >= maxRetries) {
        throw new Error(`Не удалось загрузить список контента после ${maxRetries} попыток: ${error.message}`);
      }
      
      // Ждем перед следующей попыткой (увеличивая время с каждой попыткой)
      await new Promise(resolve => setTimeout(resolve, retries * 1000));
    }
  }
}

/**
 * Загрузка содержимого Markdown-файла
 * @param {string} path - Путь к файлу
 * @returns {Promise<string>} - Промис, разрешающийся содержимым файла
 */
async function fetchContent(path) {
  console.log(`Загрузка контента: ${path}`);
  
  // Проверяем кэш
  if (contentCache.has(path)) {
    console.log('Возвращаем контент из кэша');
    return contentCache.get(path);
  }
  
  try {
    // Добавляем параметр для предотвращения кэширования
    const cacheBuster = `?t=${Date.now()}`;
    const response = await fetch(`${path}${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Файл не найден: ${path} (${response.status})`);
    }
    
    const content = await response.text();
    
    if (!content || content.trim() === '') {
      console.error(`Пустой контент в файле: ${path}`);
      return null;
    }
    
    console.log(`Контент успешно загружен, длина: ${content.length} символов`);
    
    // Сохраняем в кэш
    contentCache.set(path, content);
    return content;
  } catch (error) {
    console.error(`Ошибка при загрузке файла ${path}:`, error);
    throw error;
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
  if (!markdown) {
    console.warn('Пустой Markdown контент');
    return '';
  }
  
  try {
    console.log(`Преобразование Markdown в HTML, длина: ${markdown.length} символов`);
    
    // Убедимся, что markdown - это строка
    if (typeof markdown !== 'string') {
      console.warn('Markdown контент не является строкой, выполняем преобразование');
      markdown = String(markdown);
    }
    
    // Проверяем наличие блоков кода
    const codeBlocksMatch = markdown.match(/```[\s\S]*?```/g);
    if (codeBlocksMatch) {
      console.log(`Найдено ${codeBlocksMatch.length} блоков кода`);
      
      // Дополнительная проверка блоков кода
      for (const block of codeBlocksMatch) {
        console.log(`Блок кода: ${block.substring(0, 50)}${block.length > 50 ? '...' : ''}`);
      }
    }
    
    // Предварительная обработка проблемных конструкций в Markdown
    markdown = markdown.replace(/```javascript\s+([\s\S]*?)```/g, (match, code) => {
      // Экранируем ${} в JavaScript коде
      return '```javascript\n' + (code || '').replace(/\${/g, '\\${') + '```';
    });
    
    // Применяем marked для преобразования
    const html = marked.parse(markdown);
    
    // Проверяем результат
    if (!html || html.length === 0) {
      console.error('Результат преобразования Markdown пуст');
      return `<p>Не удалось преобразовать контент.</p>`;
    }
    
    console.log(`HTML успешно сгенерирован, длина: ${html.length} символов`);
    return html;
  } catch (error) {
    console.error('Ошибка при преобразовании Markdown:', error);
    
    // Возвращаем более информативное сообщение об ошибке
    return `
      <div class="markdown-error">
        <h3>Ошибка обработки Markdown</h3>
        <p>${error.message || 'Неизвестная ошибка'}</p>
        <details>
          <summary>Показать исходный код</summary>
          <pre>${escapeHTML(markdown.substring(0, 500))}${markdown.length > 500 ? '...' : ''}</pre>
        </details>
        <p>Пожалуйста, сообщите об этой ошибке разработчику.</p>
      </div>
    `;
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