/**
 * Модуль для рендеринга UI-элементов
 */

import { renderMarkdown } from './content.js';

/**
 * Рендеринг списка статей
 * @param {Array} posts - Массив статей
 * @param {HTMLElement} container - Контейнер для вывода
 * @param {string} title - Заголовок списка (опционально)
 */
function renderPostList(posts, container, title = 'Последние статьи') {
  if (!container) return;
  
  const heading = document.createElement('h1');
  heading.textContent = title;
  
  const list = document.createElement('ul');
  list.className = 'post-list';
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '';
    container.appendChild(heading);
    
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Статьи не найдены';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Рендерим каждую статью в списке
  posts.forEach(post => {
    const listItem = document.createElement('li');
    listItem.className = 'post-item';
    
    // Подготавливаем URL
    const slug = post.slug || post.path.split('/').pop().replace('.md', '');
    const postUrl = `/posts/${slug}`;
    
    // Форматируем дату
    const dateObj = post.date ? new Date(post.date) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
    
    // Создаем HTML для элемента списка
    listItem.innerHTML = `
      <h2 class="post-title">
        <a href="${postUrl}">${post.title || 'Без названия'}</a>
      </h2>
      ${formattedDate ? `<div class="post-meta">${formattedDate}</div>` : ''}
      ${post.summary ? `<p class="post-summary">${post.summary}</p>` : ''}
      ${renderPostTags(post.tags)}
    `;
    
    list.appendChild(listItem);
  });
  
  container.innerHTML = '';
  container.appendChild(heading);
  container.appendChild(list);
}

/**
 * Рендеринг отдельной статьи
 * @param {Object} postData - Метаданные статьи
 * @param {string} content - Содержимое статьи в формате Markdown
 * @param {HTMLElement} container - Контейнер для вывода
 */
async function renderPost(postData, content, container) {
  if (!container) return;
  
  container.innerHTML = '<div class="loader">Загрузка статьи...</div>';
  
  try {
    // Обработка даты
    const dateObj = postData.date ? new Date(postData.date) : null;
    const formattedDate = dateObj ? dateObj.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';
    
    // Преобразуем Markdown в HTML
    const htmlContent = await renderMarkdown(content);
    
    // Создаем разметку статьи
    const article = document.createElement('article');
    article.className = 'post';
    
    article.innerHTML = `
      <header class="post-header">
        <h1>${postData.title || 'Без названия'}</h1>
        ${formattedDate ? `<div class="post-meta">${formattedDate}</div>` : ''}
        ${renderPostTags(postData.tags)}
      </header>
      <div class="post-content">
        ${htmlContent}
      </div>
    `;
    
    // Добавляем кнопку "Назад"
    const backButton = document.createElement('div');
    backButton.className = 'back-link';
    backButton.innerHTML = '<a href="/">&larr; Назад к списку статей</a>';
    
    container.innerHTML = '';
    container.appendChild(article);
    container.appendChild(backButton);
    
    // Обработка ссылок на изображения в контенте
    processContentImages(container, postData);
  } catch (error) {
    console.error('Ошибка при рендеринге статьи:', error);
    container.innerHTML = '<p class="error">Ошибка при загрузке статьи</p>';
  }
}

/**
 * Рендеринг списка тегов
 * @param {Object} tags - Объект с тегами и их количеством
 * @param {HTMLElement} container - Контейнер для вывода
 */
function renderTagsList(tags, container) {
  if (!container) return;
  
  const heading = document.createElement('h1');
  heading.textContent = 'Теги';
  
  const tagsList = document.createElement('div');
  tagsList.className = 'tags-list';
  
  if (!tags || Object.keys(tags).length === 0) {
    container.innerHTML = '';
    container.appendChild(heading);
    
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Теги не найдены';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Сортируем теги по количеству статей (по убыванию)
  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
  
  // Создаем элементы для каждого тега
  sortedTags.forEach(({ tag, count }) => {
    const tagLink = document.createElement('a');
    tagLink.href = `/tags/${tag}`;
    tagLink.className = 'tag';
    tagLink.innerHTML = `${tag} <span class="tag-count">(${count})</span>`;
    
    tagsList.appendChild(tagLink);
  });
  
  container.innerHTML = '';
  container.appendChild(heading);
  container.appendChild(tagsList);
}

/**
 * Рендеринг страницы About
 * @param {Object} aboutData - Данные страницы About
 * @param {HTMLElement} container - Контейнер для вывода
 */
async function renderAbout(aboutData, container) {
  if (!container) return;
  
  container.innerHTML = '<div class="loader">Загрузка...</div>';
  
  try {
    // Получаем содержимое
    const content = aboutData.content || '# Информация отсутствует';
    
    // Преобразуем Markdown в HTML
    const htmlContent = await renderMarkdown(content);
    
    // Создаем разметку страницы
    const aboutContainer = document.createElement('div');
    aboutContainer.className = 'about-content';
    aboutContainer.innerHTML = htmlContent;
    
    container.innerHTML = '';
    container.appendChild(aboutContainer);
    
    // Обработка ссылок на изображения
    processContentImages(container, {path: 'content/about/index.md'});
  } catch (error) {
    console.error('Ошибка при рендеринге страницы About:', error);
    container.innerHTML = '<p class="error">Ошибка при загрузке информации</p>';
  }
}

/**
 * Отображение ошибки
 * @param {string} message - Сообщение об ошибке
 * @param {HTMLElement} container - Контейнер для вывода
 */
function renderError(message, container) {
  if (!container) {
    container = document.getElementById('content');
  }
  
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-message';
  
  errorContainer.innerHTML = `
    <h2>Ошибка</h2>
    <p>${message || 'Произошла неизвестная ошибка'}</p>
    <a href="/" class="button">Вернуться на главную</a>
  `;
  
  container.innerHTML = '';
  container.appendChild(errorContainer);
}

/**
 * Рендеринг тегов статьи
 * @param {Array} tags - Массив тегов
 * @returns {string} - HTML-разметка для тегов
 */
function renderPostTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return '';
  }
  
  const tagsHtml = tags.map(tag => 
    `<a href="/tags/${tag}" class="tag">${tag}</a>`
  ).join('');
  
  return `<div class="post-tags">${tagsHtml}</div>`;
}

/**
 * Обработка ссылок на изображения в контенте
 * @param {HTMLElement} container - Контейнер с контентом
 * @param {Object} contentData - Данные о контенте (путь к файлу)
 */
function processContentImages(container, contentData = {}) {
  // Находим все изображения
  const images = container.querySelectorAll('img');
  console.log(`Обработка ${images.length} изображений в контенте`);
  
  images.forEach(img => {
    // Если путь относительный и не начинается с /, добавляем путь к контенту
    const src = img.getAttribute('src');
    console.log(`Оригинальный путь к изображению: ${src}`);
    
    if (src && !src.startsWith('http') && !src.startsWith('/')) {
      // Определяем базовый путь на основе данных о контенте
      let basePath = '';
      
      if (contentData && contentData.path) {
        // Извлекаем директорию из пути к файлу
        const pathParts = contentData.path.split('/');
        pathParts.pop(); // Удаляем имя файла
        basePath = pathParts.join('/') + '/';
      } else {
        // Используем путь по умолчанию на основе текущего URL
        const pathname = window.location.pathname;
        
        if (pathname.startsWith('/posts/')) {
          basePath = 'content/posts/';
        } else if (pathname === '/about') {
          basePath = 'content/about/';
        }
      }
      
      // Обновляем путь к изображению
      const newSrc = `${basePath}${src}`;
      console.log(`Новый путь к изображению: ${newSrc}`);
      img.src = newSrc;
    }
    
    // Добавляем обработку ошибок загрузки изображений
    img.onerror = function() {
      console.error(`Ошибка загрузки изображения: ${this.src}`);
      this.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
      this.alt = 'Изображение не найдено';
    };
  });
}

// Экспортируем публичные функции
export {
  renderPostList,
  renderPost,
  renderTagsList,
  renderAbout,
  renderError
}; 