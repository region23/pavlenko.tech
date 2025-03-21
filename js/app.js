/**
 * Основной модуль приложения
 */

// Импорт модулей
import { initRouter, navigateTo, getCurrentRoute } from './router.js';
import { fetchContentList, fetchContent, processFrontmatter, clearContentCache } from './content.js';
import { renderPostList, renderPost, renderTagsList, renderAbout, renderError } from './ui.js';

// Состояние приложения
const state = {
  posts: [],
  tags: {},
  currentRoute: null,
  isLoading: false,
  aboutContent: null
};

// Маршруты приложения
const routes = {
  home: {
    pattern: /^\/(?:#.*)?$|^$/,
    handler: handleHomeRoute
  },
  post: {
    pattern: /^\/posts\/([^\/]+)(?:#.*)?$/,
    handler: handlePostRoute
  },
  tags: {
    pattern: /^\/tags(?:#.*)?$/,
    handler: handleTagsRoute
  },
  tag: {
    pattern: /^\/tags\/([^\/]+)(?:#.*)?$/,
    handler: handleTagRoute
  },
  about: {
    pattern: /^\/about(?:#.*)?$/,
    handler: handleAboutRoute
  }
};

/**
 * Инициализация приложения
 */
async function initApp() {
  try {
    console.log("Инициализация приложения");
    
    // Находим элемент контента
    const contentElement = document.getElementById('content');
    if (!contentElement) {
      throw new Error('Элемент контента не найден');
    }
    
    // Инициализация роутера
    initRouter(handleRouteChange);
    
    // Загрузка данных приложения
    await loadAppData();
    
    // Обработка текущего маршрута
    const currentPath = getCurrentRoute();
    handleRouteChange(currentPath);
    
    console.log("Инициализация завершена");
  } catch (error) {
    console.error("Ошибка инициализации приложения:", error);
    const errorElement = document.getElementById('error-container');
    if (errorElement) {
      renderError(errorElement, error);
    }
  }
}

/**
 * Загрузка данных приложения (посты, теги)
 * @returns {Promise<boolean>} - Результат загрузки
 */
async function loadAppData() {
  try {
    console.log('Загрузка данных приложения...');
    
    // Устанавливаем флаг загрузки
    state.isLoading = true;
    
    // Загружаем список статей
    const posts = await fetchContentList();
    
    // Проверяем, загрузились ли статьи
    if (!posts || posts.length === 0) {
      console.error('Не удалось загрузить статьи или список пуст');
      state.isLoading = false;
      return false;
    }
    
    // Добавляем path к каждому посту, если его нет
    posts.forEach(post => {
      if (!post.path && post.file) {
        post.path = `content/posts/${post.file}.md`;
      }
    });
    
    // Обновляем состояние приложения
    state.posts = posts;
    
    // Формируем карту тегов из постов
    const tags = {};
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!tags[tag]) {
            tags[tag] = 1;
          } else {
            tags[tag]++;
          }
        });
      }
    });
    
    // Обновляем теги в состоянии приложения
    state.tags = tags;
    
    console.log(`Загружено ${posts.length} статей и ${Object.keys(tags).length} тегов`);
    
    // Завершаем загрузку
    state.isLoading = false;
    return true;
  } catch (error) {
    console.error('Ошибка при загрузке данных приложения:', error);
    state.isLoading = false;
    throw error;
  }
}

/**
 * Обработка изменения маршрута
 * @param {string} path - Путь маршрута
 */
async function handleRouteChange(path) {
  try {
    console.log(`Обработка маршрута: ${path}`);
    
    // Находим элемент контента
    const contentElement = document.getElementById('content');
    if (!contentElement) {
      throw new Error('Элемент контента не найден');
    }
    
    // Проверяем, загружены ли необходимые данные
    if (!state.posts || state.posts.length === 0) {
      console.log('Данные не загружены, выполняем загрузку...');
      await loadAppData();
    }
    
    // Устанавливаем текущий маршрут
    state.currentRoute = path;
    
    // Показываем индикатор загрузки
    contentElement.innerHTML = '<div class="loading">Загрузка...</div>';
    state.isLoading = true;
    
    // Определяем, какой обработчик вызвать
    let handled = false;
    
    for (const [routeName, route] of Object.entries(routes)) {
      const match = path.match(route.pattern);
      if (match) {
        console.log(`Найден маршрут: ${routeName}`);
        // Очищаем содержимое перед обработкой маршрута
        contentElement.innerHTML = '';
        // Вызываем соответствующий обработчик
        await route.handler(contentElement, ...(match.slice(1)));
        // Обновляем активную ссылку в навигации
        updateActiveNavLink(path);
        handled = true;
        break;
      }
    }
    
    // Если маршрут не найден, показываем 404
    if (!handled) {
      console.log('Маршрут не найден, показываем 404');
      contentElement.innerHTML = '';
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      contentElement.appendChild(errorContainer);
      renderError(errorContainer, { message: 'Страница не найдена' }, 404);
      updatePageMeta('Страница не найдена', 'Запрашиваемая страница не найдена');
    }
    
    // Скрываем индикатор загрузки
    state.isLoading = false;
    
  } catch (error) {
    console.error("Ошибка обработки маршрута:", error);
    const contentElement = document.getElementById('content');
    if (contentElement) {
      contentElement.innerHTML = '';
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-container';
      contentElement.appendChild(errorContainer);
      renderError(errorContainer, error);
    }
    state.isLoading = false;
  }
}

/**
 * Обработчик маршрута главной страницы
 * @param {HTMLElement} container - Контейнер для отображения содержимого
 */
async function handleHomeRoute(container) {
  console.log('Отображение главной страницы со статьями');
  
  if (!state.posts || state.posts.length === 0) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Не удалось загрузить статьи' });
    return;
  }
  
  // Отображаем список статей
  renderPostList(state.posts, container);
  
  // Обновляем мета-теги для SEO
  updatePageMeta('Технический блог', 'Блог о разработке и технологиях');
}

/**
 * Обработчик маршрута отдельной статьи
 * @param {HTMLElement} container - Контейнер для отображения содержимого
 * @param {string} slug - Идентификатор статьи
 */
async function handlePostRoute(container, slug) {
  console.log('Отображение отдельной статьи, slug:', slug);
  
  if (!state.posts || state.posts.length === 0) {
    console.error('Нет загруженных статей');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Не удалось загрузить статьи' });
    return;
  }
  
  // Находим статью по slug
  const post = state.posts.find(p => 
    (p.slug === slug) || (p.file === slug)
  );
  
  if (post) {
    console.log('Статья найдена:', post.title, 'Путь:', post.path);
    
    try {
      // Создаем путь к файлу, если он не указан
      const filePath = post.path || `content/posts/${post.file}.md`;
      console.log('Используем путь для загрузки:', filePath);
      
      // Загружаем содержимое статьи
      const content = await fetchContent(filePath);
      console.log('Содержимое получено:', content ? 'успешно' : 'пусто');
      
      // Рендерим статью
      renderPost(post, content, container);
      
      // Обновляем мета-теги для SEO
      updatePageMeta(post.title, post.summary || '');
    } catch (error) {
      console.error('Ошибка при загрузке статьи:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-container';
      container.appendChild(errorDiv);
      renderError(errorDiv, error);
    }
  } else {
    console.error('Статья не найдена:', slug);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Статья не найдена' }, 404);
    updatePageMeta('Статья не найдена', 'Запрашиваемая статья не найдена');
  }
}

/**
 * Обработчик маршрута для страницы со списком тегов
 * @param {HTMLElement} container - Контейнер для отображения содержимого
 */
async function handleTagsRoute(container) {
  console.log('Отображение страницы со списком тегов');
  
  if (!state.tags || Object.keys(state.tags).length === 0) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Не удалось загрузить теги' });
    return;
  }
  
  // Отображаем список тегов
  renderTagsList(state.tags, container);
  
  // Обновляем мета-теги для SEO
  updatePageMeta('Теги', 'Список тегов блога');
}

/**
 * Обработчик маршрута для страницы с постами по тегу
 * @param {HTMLElement} container - Контейнер для отображения содержимого
 * @param {string} tag - Имя тега
 */
async function handleTagRoute(container, tag) {
  console.log('Отображение статей по тегу:', tag);
  
  if (!state.tags || Object.keys(state.tags).length === 0 || !state.posts) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Не удалось загрузить данные' });
    return;
  }
  
  // Проверяем, существует ли такой тег
  if (state.tags[tag]) {
    // Фильтруем статьи по тегу
    const filteredPosts = state.posts.filter(post => 
      post.tags && post.tags.includes(tag)
    );
    
    renderPostList(filteredPosts, container, `Статьи по тегу: ${tag}`);
    
    // Обновляем мета-теги для SEO
    updatePageMeta(`Тег: ${tag}`, `Статьи по тегу ${tag}`);
  } else {
    console.error('Тег не найден:', tag);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, { message: 'Тег не найден' }, 404);
    updatePageMeta('Тег не найден', 'Запрашиваемый тег не найден');
  }
}

/**
 * Обработчик маршрута страницы About
 * @param {HTMLElement} container - Контейнер для отображения содержимого
 */
async function handleAboutRoute(container) {
  console.log('Отображение страницы о проекте');
  
  try {
    // Загружаем содержимое страницы
    const aboutContent = await fetchContent('content/about/index.md');
    
    if (!aboutContent) {
      console.error('Не удалось загрузить страницу о проекте');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-container';
      container.appendChild(errorDiv);
      renderError(errorDiv, { message: 'Не удалось загрузить информацию о проекте' });
      return;
    }
    
    // Обрабатываем frontmatter и получаем данные
    const aboutData = processFrontmatter(aboutContent);
    
    // Сохраняем контент в состояние
    state.aboutContent = aboutData;
    
    // Рендерим страницу
    renderAbout(aboutData, container);
    
    // Обновляем мета-теги для SEO
    updatePageMeta('Обо мне', 'Информация об авторе блога');
  } catch (error) {
    console.error('Ошибка при обработке страницы о проекте:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    container.appendChild(errorDiv);
    renderError(errorDiv, error);
  }
}

/**
 * Обновляет мета-теги страницы для SEO
 * @param {string} title - Заголовок страницы
 * @param {string} description - Описание страницы
 */
function updatePageMeta(title, description) {
  // Обновляем заголовок
  document.title = title ? `${title} | Pavlenko.Tech` : 'Технический блог';
  
  // Обновляем описание
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description || 'Технический блог о разработке и технологиях');
  }
}

/**
 * Обновляет активную ссылку в навигации
 * @param {string} path - Текущий путь
 */
function updateActiveNavLink(path) {
  // Находим все ссылки в навигации
  const navLinks = document.querySelectorAll('nav a');
  
  // Удаляем класс active со всех ссылок
  navLinks.forEach(link => link.classList.remove('active'));
  
  // Определяем активную секцию
  let activeSection = '';
  
  if (path === '/' || path === '') {
    activeSection = '/';
  } else if (path.startsWith('/posts/')) {
    activeSection = '/';
  } else if (path.startsWith('/tags')) {
    activeSection = '/tags';
  } else if (path === '/about') {
    activeSection = '/about';
  }
  
  // Находим соответствующую ссылку и добавляем класс active
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === activeSection) {
      link.classList.add('active');
    }
  });
}

// Инициализируем приложение при загрузке
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт для возможного использования в других модулях
export { state }; 