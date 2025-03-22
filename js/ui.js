/**
 * Модуль для рендеринга UI-элементов
 */

import { renderMarkdown } from './content.js';

/**
 * Создает DOM элемент с заданными атрибутами и содержимым
 * @param {string} tagName - Имя тега
 * @param {Object} options - Опции элемента (id, className, etc.)
 * @param {string|HTMLElement|Array} [content] - Содержимое элемента
 * @returns {HTMLElement} Созданный элемент
 */
function createElement(tagName, options = {}, content = null) {
    const element = document.createElement(tagName);
    
    // Устанавливаем атрибуты
    Object.entries(options).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Добавляем содержимое
    if (content !== null) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof HTMLElement) {
                    element.appendChild(item);
                } else if (typeof item === 'string') {
                    element.appendChild(document.createTextNode(item));
                }
            });
        } else if (content !== undefined) {
            element.appendChild(document.createTextNode(String(content)));
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
function renderPostList(posts, container, title = 'Latest Posts') {
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Добавляем заголовок
  const titleElement = createElement('h1', {}, title);
  container.appendChild(titleElement);
  
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    const message = createElement('p', {}, 'No posts found.');
    container.appendChild(message);
    return;
  }
  
  // Создаем список статей
  const postList = createElement('ul', { className: 'post-list' });
  
  // Добавляем элементы списка
  posts.forEach(post => {
    const postItem = createElement('li', { className: 'post-item' });
    
    // Заголовок статьи со ссылкой
    const postTitle = createElement('h2', { className: 'post-title' });
    const titleLink = createElement('a', { 
      href: `/posts/${post.slug || post.file}` 
    }, post.title);
    postTitle.appendChild(titleLink);
    
    // Мета-информация (дата)
    const formattedDate = formatDate(post.date);
    
    // Расчет времени чтения
    const readingTime = post.content 
      ? calculateReadingTime(post.content) 
      : post.summary 
        ? calculateReadingTime(post.summary) * 3 // Примерная оценка
        : 3; // Значение по умолчанию в минутах
    
    const metaContainer = createElement('div', { className: 'post-meta' });
    
    const dateElement = createElement('time', { 
      datetime: post.date,
    }, `${formattedDate}`);
    
    const readingTimeElement = createElement('span', {
      className: 'reading-time'
    }, `${readingTime} min read`);
    
    metaContainer.appendChild(dateElement);
    metaContainer.appendChild(readingTimeElement);
    
    // Краткое описание статьи
    const summary = createElement('div', { 
      className: 'post-summary' 
    }, post.summary || '');
    
    // Теги статьи
    const tags = renderPostTags(post.tags);
    
    // Собираем элемент статьи
    postItem.appendChild(postTitle);
    postItem.appendChild(metaContainer);
    postItem.appendChild(summary);
    if (tags) {
      postItem.appendChild(tags);
    }
    
    postList.appendChild(postItem);
  });
  
  container.appendChild(postList);
}

/**
 * Рассчитывает примерное время чтения текста
 * @param {string} text - Текст для расчета
 * @param {number} wordsPerMinute - Средняя скорость чтения (слов в минуту)
 * @returns {number} - Время чтения в минутах
 */
function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text) return 1;
  
  // Удаляем HTML-теги и Markdown-разметку
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Удаление HTML-тегов
    .replace(/!\[.*?\]\(.*?\)/g, '') // Удаление Markdown-изображений
    .replace(/\[.*?\]\(.*?\)/g, '$1') // Замена Markdown-ссылок на текст
    .replace(/[#*_~`]/g, ''); // Удаление одиночных символов форматирования
  
  // Считаем количество слов
  const words = cleanText.split(/\s+/).filter(Boolean).length;
  
  // Рассчитываем время чтения и округляем до целого числа
  const minutes = Math.ceil(words / wordsPerMinute);
  
  // Минимум 1 минута
  return Math.max(1, minutes);
}

/**
 * Рендеринг отдельной статьи
 * @param {Object} postData - Данные статьи
 * @param {string} content - Содержимое статьи в формате Markdown
 * @param {HTMLElement} container - Контейнер для вывода
 */
async function renderPost(postData, content, container) {
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Loading article...</div>';
  
  try {
    console.log('Rendering article:', postData.title);
    
    if (!content) {
      throw new Error('Failed to load article content');
    }
    
    // Дополнительно убеждаемся, что frontmatter полностью удален
    // Регулярное выражение для frontmatter
    const frontmatterRegex = /^---[\s\S]*?---\s*/;
    
    // Удаляем frontmatter из контента
    const cleanContent = content.replace(frontmatterRegex, '');
    
    // Удаляем заголовок первого уровня из Markdown (обычно это заголовок статьи)
    const titleRegex = /^\s*# .+?\n/m;
    const contentWithoutTitle = cleanContent.replace(titleRegex, '');
    
    // Подготавливаем код перед преобразованием
    const preparedContent = contentWithoutTitle.replace(/```javascript\s+([\s\S]*?)```/g, (match, code) => {
      return '```javascript\n' + code.replace(/\${/g, '\\${') + '```';
    });
    
    // Преобразуем Markdown в HTML
    const htmlContent = await renderMarkdown(preparedContent);
    
    if (!htmlContent) {
      throw new Error('Failed to convert Markdown to HTML');
    }
    
    // Создаем разметку статьи
    const article = createElement('article', { className: 'post' });
    
    // Создаем заголовок и метаданные
    const header = createElement('header', { className: 'post-header' });
    header.appendChild(createElement('h1', {}, postData.title || 'Untitled'));
    
    // Мета-информация
    const metaContainer = createElement('div', { className: 'post-meta' });
    
    if (postData.date) {
      const dateElement = createElement('time', { 
        datetime: postData.date,
      }, formatDate(postData.date));
      metaContainer.appendChild(dateElement);
    }
    
    // Добавляем расчет времени чтения
    const readingTime = calculateReadingTime(contentWithoutTitle);
    const readingTimeElement = createElement('span', {
      className: 'reading-time'
    }, `${readingTime} min read`);
    metaContainer.appendChild(readingTimeElement);
    
    header.appendChild(metaContainer);
    
    // Добавляем теги
    const tagsEl = renderPostTags(postData.tags);
    if (tagsEl) {
      header.appendChild(tagsEl);
    }
    
    article.appendChild(header);
    
    // Создаем оглавление, если в контенте есть заголовки
    const headings = extractHeadings(htmlContent);
    if (headings.length > 1) {
      const toc = createTableOfContents(headings);
      article.appendChild(toc);
    }
    
    // Добавляем содержимое статьи
    const contentElement = createElement('div', { 
      className: 'post-content',
      innerHTML: htmlContent
    });
    
    article.appendChild(contentElement);
    
    // Обработка изображений в контенте
    processContentImages(contentElement, postData);
    
    // Добавляем кнопки социального шаринга
    const shareSection = createElement('div', { className: 'social-share' });
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(postData.title);
    
    const twitterButton = createElement('a', {
      href: `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`,
      className: 'social-button twitter-share',
      target: '_blank',
      rel: 'noopener'
    }, 'Share on Twitter');
    
    const linkedinButton = createElement('a', {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
      className: 'social-button linkedin-share',
      target: '_blank',
      rel: 'noopener'
    }, 'Share on LinkedIn');
    
    shareSection.appendChild(twitterButton);
    shareSection.appendChild(linkedinButton);
    article.appendChild(shareSection);
    
    // Очищаем контейнер и добавляем статью
    container.innerHTML = '';
    container.appendChild(article);
  } catch (error) {
    console.error('Error rendering article:', error);
    container.innerHTML = '';
    renderError(container, error);
  }
}

/**
 * Извлекает заголовки из HTML-контента
 * @param {string} html - HTML-контент
 * @returns {Array} - Массив объектов с информацией о заголовках
 */
function extractHeadings(html) {
  const headings = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Находим все заголовки h2 и h3
  const headingElements = doc.querySelectorAll('h2, h3');
  
  headingElements.forEach((heading, index) => {
    // Добавляем id к заголовку, если его нет
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
    
    headings.push({
      id: heading.id,
      text: heading.textContent,
      level: parseInt(heading.tagName.substring(1)) // Получаем число из h2, h3
    });
  });
  
  return headings;
}

/**
 * Создает оглавление на основе заголовков
 * @param {Array} headings - Массив объектов с информацией о заголовках
 * @returns {HTMLElement} - HTML-элемент с оглавлением
 */
function createTableOfContents(headings) {
  const toc = createElement('div', { className: 'table-of-contents' });
  const tocTitle = createElement('h3', {}, 'Table of Contents');
  const tocList = createElement('ul', {});
  
  headings.forEach(heading => {
    const listItem = createElement('li', {
      style: heading.level === 3 ? 'margin-left: 1rem;' : ''
    });
    
    const link = createElement('a', {
      href: `#${heading.id}`
    }, heading.text);
    
    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });
  
  toc.appendChild(tocTitle);
  toc.appendChild(tocList);
  
  return toc;
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
    
    // Удаляем frontmatter из контента
    const frontmatterRegex = /^---[\s\S]*?---\s*/;
    const cleanContent = content.replace(frontmatterRegex, '');
    
    // Удаляем заголовок первого уровня из Markdown (обычно это заголовок "Обо мне")
    const titleRegex = /^\s*# .+?\n/m;
    const contentWithoutTitle = cleanContent.replace(titleRegex, '');
    
    // Преобразуем Markdown в HTML
    const htmlContent = await renderMarkdown(contentWithoutTitle);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем структуру страницы, аналогичную странице статьи для единообразия
    const article = createElement('article', { className: 'post about-page' });
    
    // Добавляем заголовок в стиле статьи
    const header = createElement('header', { className: 'post-header' });
    header.appendChild(createElement('h1', {}, 'Обо мне'));
    article.appendChild(header);
    
    // Добавляем контент
    const contentElement = createElement('div', { 
      className: 'post-content about-content'
    });
    
    // Используем innerHTML для вставки HTML-контента
    contentElement.innerHTML = htmlContent;
    
    article.appendChild(contentElement);
    
    // Добавляем статью в контейнер
    container.appendChild(article);
  } catch (error) {
    console.error('Ошибка при рендеринге страницы About:', error);
    renderError(container, error);
  }
}

/**
 * Отображение ошибки
 * @param {HTMLElement} container - Контейнер для отображения ошибки
 * @param {Object|string} error - Объект ошибки или сообщение
 * @param {number} statusCode - Код HTTP-статуса (опционально)
 */
function renderError(container, error, statusCode = 500) {
  if (!container) {
    console.error('Не указан контейнер для отображения ошибки');
    return;
  }
  
  // Очищаем контейнер если он не пустой
  if (container.innerHTML !== '') {
    container.innerHTML = '';
  }
  
  // Получаем сообщение об ошибке
  let errorMessage = 'Произошла неизвестная ошибка';
  let errorTitle = 'Ошибка';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  } else if (error && typeof error === 'object' && error.message) {
    errorMessage = error.message;
    if (error.title) {
      errorTitle = error.title;
    }
  }
  
  // Определяем заголовок ошибки на основе статус-кода
  if (statusCode === 404) {
    errorTitle = 'Страница не найдена';
  } else if (statusCode === 403) {
    errorTitle = 'Доступ запрещен';
  } else if (statusCode >= 500) {
    errorTitle = 'Ошибка сервера';
  }
  
  // Создаем элементы ошибки
  const errorHeading = createElement('h2', {}, errorTitle);
  const errorText = createElement('p', {}, errorMessage);
  const homeLink = createElement('a', { 
    href: '/',
    className: 'button'
  }, 'Вернуться на главную');
  
  // Добавляем элементы в контейнер
  container.appendChild(errorHeading);
  container.appendChild(errorText);
  container.appendChild(homeLink);
  
  // Прокручиваем страницу к ошибке
  container.scrollIntoView({ behavior: 'smooth' });
  
  // Логируем ошибку в консоль
  console.error(`[${statusCode}] ${errorTitle}: ${errorMessage}`);
}

/**
 * Обработка ссылок на изображения в контенте
 * @param {HTMLElement} container - Контейнер с контентом
 * @param {Object} contentData - Данные о контенте (путь к файлу)
 */
function processContentImages(container, contentData) {
  if (!container) return;
  
  const images = container.querySelectorAll('img');
  if (!images || images.length === 0) return;
  
  console.log(`Обработка ${images.length} изображений в контенте`);
  
  // Создаем обработчик для контейнера заранее, чтобы не добавлять его многократно
  let hasImageHandler = container.hasAttribute('data-image-handler');
  
  images.forEach(img => {
    // Проверяем, есть ли у изображения атрибут src
    const originalSrc = img.getAttribute('src');
    if (!originalSrc) return;
    
    // Уже устанавливаем обработчик ошибок сразу
    img.onerror = function() {
      console.warn(`Ошибка загрузки изображения: ${img.src}`);
      // Проверяем, не является ли текущее изображение уже заглушкой
      if (!img.src.includes('placeholder.svg')) {
        console.log(`Замена изображения на заглушку: ${img.src} -> /images/placeholder.svg`);
        img.src = '/images/placeholder.svg';
        img.setAttribute('data-original-src', originalSrc);
        img.classList.add('placeholder-image');
        img.setAttribute('title', 'Не удалось загрузить изображение');
      }
    };
    
    // Если путь относительный, обновляем его
    if (!originalSrc.startsWith('http') && !originalSrc.startsWith('/') && !originalSrc.startsWith('data:')) {
      // Формируем путь на основе contentData.path
      let basePath = '';
      if (contentData && contentData.path) {
        const pathParts = contentData.path.split('/');
        pathParts.pop(); // Удаляем имя файла
        basePath = pathParts.join('/') + '/';
      }
      
      const newSrc = basePath + originalSrc;
      console.log(`Обновлен путь изображения: ${originalSrc} -> ${newSrc}`);
      img.src = newSrc;
    }
    
    // Добавляем классы для стилизации
    img.classList.add('content-image');
    img.setAttribute('data-action', 'zoom');
  });
  
  // Добавляем обработчик событий на контейнер только один раз
  if (!hasImageHandler) {
    container.setAttribute('data-image-handler', 'true');
    
    container.addEventListener('click', function(e) {
      const target = e.target;
      if (target.tagName === 'IMG' && target.getAttribute('data-action') === 'zoom') {
        // Не открываем модальное окно для изображений-заглушек
        if (target.classList.contains('placeholder-image')) {
          console.log('Изображение-заглушка, модальное окно не открывается');
          return;
        }
        
        e.preventDefault();
        openImageModal(target.src, target.alt);
      }
    });
  }
}

/**
 * Открывает модальное окно с изображением
 * @param {string} src - Путь к изображению
 * @param {string} [alt] - Альтернативный текст/подпись к изображению
 */
function openImageModal(src, alt) {
    // Проверяем, существует ли уже модальное окно
    let existingModal = document.querySelector('.image-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    
    // Создаем контейнер изображения
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-modal-content';
    
    // Создаем изображение
    const img = document.createElement('img');
    img.src = src;
    if (alt) {
        img.alt = alt;
    }
    
    // Обработчик ошибок для изображения
    img.onerror = function() {
        console.warn(`Ошибка загрузки изображения в модальном окне: ${src}`);
        img.src = '/images/placeholder.svg';
        img.classList.add('placeholder-image');
        if (img.parentNode) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'image-error-message';
            errorMessage.textContent = 'Не удалось загрузить изображение';
            img.parentNode.appendChild(errorMessage);
        }
    };
    
    // Добавляем кнопку закрытия
    const closeBtn = document.createElement('span');
    closeBtn.className = 'image-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        document.body.removeChild(modal);
    };
    
    // Собираем модальное окно
    imgContainer.appendChild(img);
    modal.appendChild(closeBtn);
    modal.appendChild(imgContainer);
    
    // Добавляем подпись к изображению, если она есть
    if (alt) {
        const caption = document.createElement('div');
        caption.className = 'image-modal-caption';
        caption.textContent = alt;
        modal.appendChild(caption);
    }
    
    // Добавляем модальное окно в DOM
    document.body.appendChild(modal);
    
    // Закрытие по клику вне изображения
    modal.onclick = function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    // Закрытие по Escape
    const handleKeyDown = function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
}

// Экспортируем функции
export {
  renderPostList,
  renderPost,
  renderTagsList,
  renderAbout,
  renderError,
  formatDate,
  calculateReadingTime,
  extractHeadings,
  createTableOfContents
}; 