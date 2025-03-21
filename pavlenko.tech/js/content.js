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

/**
 * Загрузка списка контента из директории
 * @param {string} directory - Путь к директории с контентом
 * @returns {Promise<Array>} - Промис, разрешающийся массивом элементов контента
 */
async function fetchContentList(directory) {
  try {
    // Загружаем index.json из директории с контентом
    const response = await fetch(`${directory}/index.json`);
    
    if (response.ok) {
      // Если файл существует, используем его
      const contentIndex = await response.json();
      return contentIndex.map(item => {
        // Добавляем полный путь к элементу
        return {
          ...item,
          path: `${directory}/${item.file || item.slug || ''}.md`
        };
      });
    } else {
      // Если файла нет, возвращаем пример для тестирования
      console.warn(`Файл индекса не найден в ${directory}. Используем тестовый контент.`);
      return getDemoContent(directory);
    }
  } catch (error) {
    console.error('Ошибка при загрузке списка контента:', error);
    return getDemoContent(directory);
  }
}

/**
 * Получение демо-контента для тестирования
 * @param {string} directory - Путь к директории
 * @returns {Array} - Массив с демо-контентом
 */
function getDemoContent(directory) {
  if (directory === 'content/posts') {
    return [
      {
        title: 'Пример статьи в блоге',
        date: '2024-05-01',
        tags: ['javascript', 'web'],
        summary: 'Это пример первой статьи в блоге для демонстрации функционала.',
        slug: 'hello-world',
        path: 'content/posts/hello-world.md'
      },
      {
        title: 'Вторая статья для примера',
        date: '2024-04-20',
        tags: ['markdown', 'tutorial'],
        summary: 'Демонстрация возможностей Markdown и структуры статей.',
        slug: 'example-post',
        path: 'content/posts/example-post.md'
      }
    ];
  }
  
  return [];
}

/**
 * Загрузка содержимого Markdown-файла
 * @param {string} path - Путь к файлу
 * @returns {Promise<string>} - Промис, разрешающийся содержимым файла
 */
async function fetchContent(path) {
  try {
    const response = await fetch(path);
    
    if (response.ok) {
      return await response.text();
    } else {
      // Если файл не найден, создаем тестовый контент
      console.warn(`Файл ${path} не найден. Используем тестовый контент.`);
      return getDemoFileContent(path);
    }
  } catch (error) {
    console.error(`Ошибка при загрузке файла ${path}:`, error);
    return getDemoFileContent(path);
  }
}

/**
 * Получение демо-содержимого файла для тестирования
 * @param {string} path - Путь к файлу
 * @returns {string} - Содержимое для демонстрации
 */
function getDemoFileContent(path) {
  if (path === 'content/posts/hello-world.md') {
    return `---
title: "Пример статьи в блоге"
date: "2024-05-01"
tags: ["javascript", "web"]
summary: "Это пример первой статьи в блоге для демонстрации функционала."
---

# Пример статьи в блоге

Добро пожаловать в мой технический блог! Это первая статья, созданная для демонстрации функционала.

## Возможности Markdown

Markdown позволяет легко форматировать текст:

- **Жирный текст** для выделения
- *Курсив* для акцентирования
- ~~Зачеркнутый текст~~ для устаревшей информации

### Блоки кода

\`\`\`javascript
// Пример кода на JavaScript
function greet(name) {
  return \`Привет, \${name}!\`;
}

console.log(greet('мир'));
\`\`\`

### Цитаты

> Цитата для примера оформления блока с цитатой.
> Можно использовать несколько строк.

## Изображения и ссылки

Ссылки [работают так](https://example.com), а изображения вставляются следующим образом:

![Пример изображения](https://via.placeholder.com/600x400)

## Заключение

Это простой пример статьи, демонстрирующий основные возможности Markdown для создания контента блога.`;
  } else if (path === 'content/posts/example-post.md') {
    return `---
title: "Вторая статья для примера"
date: "2024-04-20"
tags: ["markdown", "tutorial"]
summary: "Демонстрация возможностей Markdown и структуры статей."
---

# Вторая статья для примера

Это вторая демонстрационная статья для тестирования функционала блога.

## Таблицы в Markdown

| Заголовок 1 | Заголовок 2 | Заголовок 3 |
|-------------|-------------|-------------|
| Ячейка 1-1  | Ячейка 1-2  | Ячейка 1-3  |
| Ячейка 2-1  | Ячейка 2-2  | Ячейка 2-3  |

## Списки

Нумерованный список:

1. Первый пункт
2. Второй пункт
3. Третий пункт

Вложенный список:

- Фрукты
  - Яблоки
  - Груши
  - Апельсины
- Овощи
  - Морковь
  - Картофель

## Дополнительные элементы

Горизонтальная линия:

---

Задача:
- [x] Выполненная задача
- [ ] Задача в процессе

## Заключение

Это еще один пример статьи для демонстрации возможностей блога.`;
  } else if (path === 'content/about/index.md') {
    return `---
title: "Обо мне"
---

# Обо мне

Привет! Меня зовут Павленко, и это мой технический блог, где я делюсь своими знаниями и опытом в разработке.

## Мой опыт

Я работаю в сфере разработки программного обеспечения уже несколько лет, специализируясь на web-технологиях.

## Контакты

- GitHub: [github.com/username](https://github.com/username)
- Email: mail@example.com
- Twitter: [@username](https://twitter.com/username)

Буду рад общению и обмену опытом!`;
  }
  
  return '# Контент не найден\n\nИзвините, запрашиваемый контент не найден.';
}

/**
 * Обработка frontmatter в Markdown-файле
 * @param {string} content - Содержимое Markdown-файла
 * @returns {Object} - Объект с метаданными из frontmatter
 */
function processFrontmatter(content) {
  // Шаблон для поиска frontmatter (данные между --- в начале файла)
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
  
  // Добавляем содержимое без frontmatter
  result.content = content.replace(frontmatterRegex, '');
  
  return result;
}

/**
 * Преобразование Markdown в HTML
 * @param {string} markdown - Markdown-текст
 * @returns {Promise<string>} - Promise с HTML-текстом
 */
async function renderMarkdown(markdown) {
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error('Ошибка при рендеринге Markdown:', error);
    return `<p>Ошибка при обработке Markdown: ${error.message}</p>`;
  }
}

// Экспортируем публичные функции
export {
  fetchContentList,
  fetchContent,
  processFrontmatter,
  renderMarkdown
}; 