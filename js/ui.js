/**
 * Модуль для рендеринга UI-элементов
 */

import { renderMarkdown } from './content.js';

/**
 * Создаёт элемент DOM с заданными атрибутами и содержимым
 * @param {string} tag - Тег элемента
 * @param {Object} attrs - Атрибуты элемента
 * @param {string|HTMLElement|Array} content - Содержимое элемента
 * @returns {HTMLElement} - Созданный элемент
 */
function createElement(tag, attrs = {}, content = null) {
  const element = document.createElement(tag);
  
  // Устанавливаем атрибуты
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Добавляем содержимое
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(item => {
        if (item instanceof HTMLElement) {
          element.appendChild(item);
        } else if (item) {
          element.appendChild(document.createTextNode(String(item)));
        }
      });
    }
  }
  
  return element;
}

/**
 * Форматирует дату в локализованном формате
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Рендеринг тегов статьи
 * @param {Array} tags - Массив тегов
 * @returns {HTMLElement|null} - Элемент с тегами или null
 */
function renderPostTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return null;
  }
  
  const tagsContainer = createElement('div', { className: 'post-tags' });
  
  tags.forEach(tag => {
    const tagLink = createElement('a', { 
      href: `/tags/${tag}`,
      className: 'tag'
    }, tag);
    
    tagsContainer.appendChild(tagLink);
  });
  
  return tagsContainer;
}

/**
 * Рендеринг списка статей
 * @param {Array} posts - Массив статей
 * @param {HTMLElement} container - Контейнер для вывода
 * @param {string} title - Заголовок списка (опционально)
 */
function renderPostList(posts, container, title = 'Последние статьи') {
  if (!container) return;
  
  const heading = createElement('h1', {}, title);
  
  // Очищаем контейнер
  container.innerHTML = '';
  container.appendChild(heading);
  
  if (!posts || posts.length === 0) {
    container.appendChild(createElement('p', {}, 'Статьи не найдены'));
    return;
  }
  
  const list = createElement('ul', { className: 'post-list' });
  
  // Рендерим каждую статью в списке
  posts.forEach(post => {
    const slug = post.slug || post.path.split('/').pop().replace('.md', '');
    const postUrl = `/posts/${slug}`;
    const formattedDate = formatDate(post.date);
    
    const listItem = createElement('li', { className: 'post-item' });
    
    // Заголовок
    const titleEl = createElement('h2', { className: 'post-title' },
      createElement('a', { href: postUrl }, post.title || 'Без названия')
    );
    listItem.appendChild(titleEl);
    
    // Дата
    if (formattedDate) {
      listItem.appendChild(createElement('div', { className: 'post-meta' }, formattedDate));
    }
    
    // Описание
    if (post.summary) {
      listItem.appendChild(createElement('p', { className: 'post-summary' }, post.summary));
    }
    
    // Теги
    const tagsEl = renderPostTags(post.tags);
    if (tagsEl) {
      listItem.appendChild(tagsEl);
    }
    
    list.appendChild(listItem);
  });
  
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
    // Преобразуем Markdown в HTML
    const htmlContent = await renderMarkdown(content);
    const formattedDate = formatDate(postData.date);
    
    // Создаем разметку статьи
    const article = createElement('article', { className: 'post' });
    
    // Создаем заголовок
    const header = createElement('header', { className: 'post-header' });
    header.appendChild(createElement('h1', {}, postData.title || 'Без названия'));
    
    if (formattedDate) {
      header.appendChild(createElement('div', { className: 'post-meta' }, formattedDate));
    }
    
    const tagsEl = renderPostTags(postData.tags);
    if (tagsEl) {
      header.appendChild(tagsEl);
    }
    
    article.appendChild(header);
    
    // Добавляем содержимое
    article.appendChild(createElement('div', { 
      className: 'post-content'
    }, htmlContent));
    
    // Добавляем кнопку "Назад"
    const backButton = createElement('div', { className: 'back-link' },
      createElement('a', { href: '/' }, '&larr; Назад к списку статей')
    );
    
    container.innerHTML = '';
    container.appendChild(article);
    container.appendChild(backButton);
    
    // Обработка ссылок на изображения в контенте
    processContentImages(container, postData);
  } catch (error) {
    console.error('Ошибка при рендеринге статьи:', error);
    renderError('Ошибка при загрузке статьи', container);
  }
}

/**
 * Рендеринг списка тегов
 * @param {Object} tags - Объект с тегами и их количеством
 * @param {HTMLElement} container - Контейнер для вывода
 */
function renderTagsList(tags, container) {
  if (!container) return;
  
  const heading = createElement('h1', {}, 'Теги');
  
  container.innerHTML = '';
  container.appendChild(heading);
  
  if (!tags || Object.keys(tags).length === 0) {
    container.appendChild(createElement('p', {}, 'Теги не найдены'));
    return;
  }
  
  // Сортируем теги по количеству статей (по убыванию)
  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1]);
  
  const tagsList = createElement('div', { className: 'tags-list' });
  
  // Создаем элементы для каждого тега
  sortedTags.forEach(([tag, count]) => {
    const tagLink = createElement('a', { 
      href: `/tags/${tag}`,
      className: 'tag'
    }, `${tag} <span class="tag-count">(${count})</span>`);
    
    tagsList.appendChild(tagLink);
  });
  
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
    
    container.innerHTML = '';
    container.appendChild(createElement('div', { 
      className: 'about-content'
    }, htmlContent));
    
    // Обработка ссылок на изображения
    processContentImages(container, { path: 'content/about/index.md' });
  } catch (error) {
    console.error('Ошибка при рендеринге страницы About:', error);
    renderError('Ошибка при загрузке информации', container);
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
  
  const errorContainer = createElement('div', { className: 'error-message' });
  
  errorContainer.appendChild(createElement('h2', {}, 'Ошибка'));
  errorContainer.appendChild(createElement('p', {}, message || 'Произошла неизвестная ошибка'));
  errorContainer.appendChild(createElement('a', { 
    href: '/',
    className: 'button'
  }, 'Вернуться на главную'));
  
  container.innerHTML = '';
  container.appendChild(errorContainer);
}

/**
 * Обработка ссылок на изображения в контенте
 * @param {HTMLElement} container - Контейнер с контентом
 * @param {Object} contentData - Данные о контенте (путь к файлу)
 */
function processContentImages(container, contentData = {}) {
  // Находим все изображения
  const images = container.querySelectorAll('img');
  
  if (images.length === 0) return;
  
  console.log(`Обработка ${images.length} изображений в контенте`);
  
  images.forEach(img => {
    const src = img.getAttribute('src');
    
    // Если путь относительный и не начинается с /, добавляем путь к контенту
    if (src && !src.startsWith('http') && !src.startsWith('/') && contentData.path) {
      // Получаем базовый путь к директории с контентом
      const basePath = contentData.path.split('/').slice(0, -1).join('/');
      const newSrc = `${basePath}/${src}`;
      
      img.setAttribute('src', newSrc);
      console.log(`Обновлен путь к изображению: ${src} -> ${newSrc}`);
    }
    
    // Добавляем обработку клика для увеличения изображения
    img.addEventListener('click', () => {
      openImageModal(img.getAttribute('src'), img.getAttribute('alt'));
    });
    
    // Добавляем класс для стилизации
    img.classList.add('content-image');
  });
}

/**
 * Открытие модального окна с изображением
 * @param {string} src - Путь к изображению
 * @param {string} alt - Альтернативный текст
 */
function openImageModal(src, alt) {
  // Проверяем, существует ли уже модальное окно
  let modal = document.getElementById('image-modal');
  
  if (!modal) {
    // Создаем модальное окно, если его нет
    modal = createElement('div', { 
      id: 'image-modal',
      className: 'image-modal'
    });
    
    document.body.appendChild(modal);
    
    // Добавляем обработчик для закрытия по клику
    modal.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  // Обновляем содержимое
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${src}" alt="${alt || 'Изображение'}">
      ${alt ? `<p class="modal-caption">${alt}</p>` : ''}
    </div>
  `;
  
  // Активируем модальное окно
  modal.classList.add('active');
}

// Экспортируем публичные функции
export {
  renderPostList,
  renderPost,
  renderTagsList,
  renderAbout,
  renderError
}; 