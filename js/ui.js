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
      className: 'post-tag'
    }, tag);
    
    tagsContainer.appendChild(tagLink);
  });
  
  return tagsContainer;
}

/**
 * Рендерит hero секцию в стиле Apple
 * @param {HTMLElement} container - Контейнер для hero секции
 * @param {string} title - Заголовок hero секции
 * @param {string} subtitle - Подзаголовок hero секции
 */
function renderHero(container, title = 'Pavlenko.Tech', subtitle = 'Технический блог о разработке, технологиях и программировании') {
  container.innerHTML = '';
  
  const heroSection = createElement('section', { className: 'hero' });
  const heroContainer = createElement('div', { className: 'container' });
  
  const heroTitle = createElement('h1', {}, title);
  const heroSubtitle = createElement('p', {}, subtitle);
  
  heroContainer.appendChild(heroTitle);
  heroContainer.appendChild(heroSubtitle);
  heroSection.appendChild(heroContainer);
  
  container.appendChild(heroSection);
}

/**
 * Рендеринг списка статей
 * @param {Array} posts - Массив статей
 * @param {HTMLElement} container - Контейнер для вывода
 * @param {string} title - Заголовок списка (опционально)
 */
function renderPostList(posts, container, title = 'Последние статьи') {
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Добавляем hero секцию на главную страницу
  const heroContainer = document.getElementById('hero-container');
  if (heroContainer) {
    renderHero(heroContainer);
  }
  
  // Создаем заголовок списка
  const heading = createElement('h2', {}, title);
  container.appendChild(heading);
  
  // Если нет статей
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    const emptyMessage = createElement('p', {}, 'Статьи не найдены.');
    container.appendChild(emptyMessage);
    return;
  }
  
  // Создаем список статей
  const postList = createElement('ul', { className: 'post-list' });
  
  // Добавляем каждую статью в список
  posts.forEach(post => {
    const postItem = createElement('li', { className: 'post-item' });
    
    // Добавляем изображение (превью)
    const thumbnail = createElement('div', { className: 'post-thumbnail' });
    const thumbnailImg = createElement('img', { 
      src: post.thumbnail || '/images/default-thumbnail.svg',
      alt: post.title,
      onerror: "this.src='/images/default-thumbnail.svg'"
    });
    thumbnail.appendChild(thumbnailImg);
    postItem.appendChild(thumbnail);
    
    // Контент поста
    const postContent = createElement('div', { className: 'post-content' });
    
    // Заголовок с ссылкой
    const titleElement = createElement('h3', { className: 'post-title' });
    const titleLink = createElement('a', { href: `/posts/${post.slug}` }, post.title);
    titleElement.appendChild(titleLink);
    
    // Метаданные (дата, автор)
    const metaElement = createElement('div', { className: 'post-meta' });
    
    // Дата публикации
    if (post.date) {
      const dateElement = createElement('span', { className: 'post-date' }, formatDate(post.date));
      metaElement.appendChild(dateElement);
    }
    
    // Краткое описание
    const summaryElement = createElement('p', { className: 'post-summary' }, post.summary || post.excerpt || '');
    
    // Добавляем все элементы в контент
    postContent.appendChild(titleElement);
    postContent.appendChild(metaElement);
    postContent.appendChild(summaryElement);
    
    // Добавляем теги, если они есть
    const tagsElement = renderPostTags(post.tags);
    if (tagsElement) {
      postContent.appendChild(tagsElement);
    }
    
    // Добавляем содержимое в карточку
    postItem.appendChild(postContent);
    
    // Добавляем карточку в список
    postList.appendChild(postItem);
  });
  
  // Добавляем список в контейнер
  container.appendChild(postList);
}

/**
 * Рендеринг отдельной статьи
 * @param {Object} postData - Данные статьи
 * @param {string} content - Содержимое статьи в формате Markdown
 * @param {HTMLElement} container - Контейнер для вывода
 */
async function renderPost(postData, content, container) {
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Скрываем hero секцию на странице статьи
  const heroContainer = document.getElementById('hero-container');
  if (heroContainer) {
    heroContainer.innerHTML = '';
  }
  
  // Создаем основной контейнер для статьи
  const article = createElement('article', { className: 'article' });
  
  // Создаем шапку статьи
  const header = createElement('header', { className: 'article-header' });
  
  // Заголовок статьи
  const title = createElement('h1', { className: 'article-title' }, postData.title || 'Без названия');
  header.appendChild(title);
  
  // Метаданные статьи (дата, автор)
  const meta = createElement('div', { className: 'article-meta' });
  
  // Дата публикации
  if (postData.date) {
    const dateElement = createElement('span', { className: 'post-date' }, formatDate(postData.date));
    meta.appendChild(dateElement);
  }
  
  header.appendChild(meta);
  
  // Теги
  const tagsElement = renderPostTags(postData.tags);
  if (tagsElement) {
    header.appendChild(tagsElement);
  }
  
  article.appendChild(header);
  
  // Содержимое статьи
  try {
    const renderedContent = await renderMarkdown(content);
    
    // Обрабатываем содержимое и создаем элемент контента
    const contentElement = createElement('div', { className: 'article-content' });
    contentElement.innerHTML = renderedContent;
    
    // Обработка изображений
    processContentImages(contentElement, postData);
    
    article.appendChild(contentElement);
  } catch (error) {
    console.error('Ошибка при рендеринге статьи:', error);
    
    const errorMessage = createElement('div', { className: 'error' }, 
      `Не удалось обработать содержимое статьи: ${error.message}`
    );
    
    article.appendChild(errorMessage);
  }
  
  // Добавляем статью в контейнер
  container.appendChild(article);
  
  // Обновляем заголовок страницы
  document.title = `${postData.title || 'Статья'} | Pavlenko.Tech`;
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

// Экспортируем публичные функции
export {
  renderPostList,
  renderPost,
  renderTagsList,
  renderAbout,
  renderError
}; 