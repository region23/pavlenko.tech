/**
 * Основной модуль приложения
 */

// Импорт модулей
import { initRouter, navigateTo } from './router.js';
import { fetchContentList, fetchContent, processFrontmatter, clearContentCache } from './content.js';
import { renderPostList, renderPost, renderTagsList, renderAbout, renderError } from './ui.js';

// Состояние приложения
const state = {
  posts: [],
  tags: {},
  currentRoute: null,
  isLoading: false
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
    
    // Загрузка данных
    await loadAppData();
    
    // Инициализация роутера
    initRouter(handleRouteChange);
    
    // Обработка кликов по навигационным ссылкам
    document.addEventListener('click', handleNavigation);
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    renderError('Ошибка загрузки данных. Пожалуйста, обновите страницу.');
  }
}

/**
 * Загрузка данных приложения
 */
async function loadAppData() {
  try {
    // Загрузка списка статей
    const posts = await fetchContentList('content/posts');
    
    if (posts && posts.length > 0) {
      // Сортировка статей по дате (сначала новые)
      state.posts = posts.sort((a, b) => 
        new Date(b.date || 0) - new Date(a.date || 0)
      );
      
      // Формирование списка тегов
      state.tags = posts.reduce((tags, post) => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tags[tag] = (tags[tag] || 0) + 1;
          });
        }
        return tags;
      }, {});
      
      console.log(`Загружено ${posts.length} статей`);
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    throw error;
  }
}

/**
 * Обработка изменения маршрута
 * @param {string} pathname - Путь URL
 */
async function handleRouteChange(pathname) {
  if (state.isLoading) return;
  
  console.log(`Обработка маршрута: ${pathname}`);
  
  // Показываем индикатор загрузки
  const contentElement = document.getElementById('content');
  contentElement.innerHTML = '<div class="loader">Загрузка...</div>';
  
  // Обновление текущего маршрута
  state.currentRoute = pathname;
  state.isLoading = true;
  
  try {
    // Определяем обработчик для маршрута
    let routeHandler = null;
    let routeParams = [];
    
    for (const [name, route] of Object.entries(routes)) {
      const match = pathname.match(route.pattern);
      if (match) {
        routeHandler = route.handler;
        routeParams = match.slice(1);
        break;
      }
    }
    
    // Если обработчик найден, вызываем его
    if (routeHandler) {
      await routeHandler(contentElement, ...routeParams);
    } else {
      // 404 - страница не найдена
      console.error(`Страница не найдена: ${pathname}`);
      renderError('Страница не найдена', contentElement);
      updatePageMeta('404: Страница не найдена', 'Запрашиваемая страница не существует');
    }
    
    // Обновление активного пункта меню
    updateActiveNavLink(pathname);
  } catch (error) {
    console.error('Ошибка обработки маршрута:', error);
    renderError('Что-то пошло не так. Пожалуйста, попробуйте еще раз.', contentElement);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Обработчик маршрута главной страницы
 * @param {HTMLElement} container - Контейнер для рендеринга
 */
async function handleHomeRoute(container) {
  renderPostList(state.posts, container);
  updatePageMeta('Технический блог', 'Блог о разработке и технологиях');
}

/**
 * Обработчик маршрута отдельной статьи
 * @param {HTMLElement} container - Контейнер для рендеринга
 * @param {string} slug - Идентификатор статьи
 */
async function handlePostRoute(container, slug) {
  if (!slug) {
    renderError('Неверный URL статьи', container);
    return;
  }
  
  console.log(`Поиск статьи по slug: ${slug}`);
  
  // Находим статью по slug
  const postData = state.posts.find(post => {
    const postSlug = post.slug || post.path.split('/').pop().replace('.md', '');
    return postSlug === slug;
  });
  
  if (!postData) {
    console.error(`Статья не найдена по slug: ${slug}`);
    renderError('Статья не найдена', container);
    updatePageMeta('Статья не найдена', 'Запрашиваемая статья не существует');
    return;
  }
  
  console.log(`Статья найдена: ${postData.title}`);
  const postPath = postData.path || `content/posts/${slug}.md`;
  
  try {
    const postContent = await fetchContent(postPath);
    
    if (postContent) {
      renderPost(postData, postContent, container);
      updatePageMeta(postData.title, postData.summary || '');
    } else {
      renderError('Содержимое статьи не найдено', container);
      updatePageMeta('Ошибка', 'Не удалось загрузить содержимое статьи');
    }
  } catch (error) {
    console.error('Ошибка при загрузке статьи:', error);
    renderError('Ошибка при загрузке статьи', container);
  }
}

/**
 * Обработчик маршрута страницы тегов
 * @param {HTMLElement} container - Контейнер для рендеринга
 */
async function handleTagsRoute(container) {
  renderTagsList(state.tags, container);
  updatePageMeta('Теги', 'Список всех тегов');
}

/**
 * Обработчик маршрута отдельного тега
 * @param {HTMLElement} container - Контейнер для рендеринга
 * @param {string} tag - Тег для фильтрации статей
 */
async function handleTagRoute(container, tag) {
  if (!tag) {
    renderError('Неверный URL тега', container);
    return;
  }
  
  const filteredPosts = state.posts.filter(post => 
    post.tags && post.tags.includes(tag)
  );
  
  renderPostList(filteredPosts, container, `Статьи с тегом: ${tag}`);
  updatePageMeta(`Тег: ${tag}`, `Статьи с тегом ${tag}`);
}

/**
 * Обработчик маршрута страницы about
 * @param {HTMLElement} container - Контейнер для рендеринга
 */
async function handleAboutRoute(container) {
  try {
    const aboutContent = await fetchContent('content/about/index.md');
    
    if (aboutContent) {
      const aboutData = processFrontmatter(aboutContent) || {};
      renderAbout(aboutData, container);
      updatePageMeta('About', aboutData.title || 'Обо мне');
    } else {
      renderError('Информация не найдена', container);
      updatePageMeta('About', 'Информация об авторе');
    }
  } catch (error) {
    console.error('Ошибка при загрузке страницы about:', error);
    renderError('Ошибка при загрузке информации', container);
  }
}

/**
 * Обработка кликов по ссылкам для навигации
 * @param {Event} event - Событие клика
 */
function handleNavigation(event) {
  const link = event.target.closest('a');
  
  if (!link || !link.href) return;
  
  // Проверяем, что это внутренняя ссылка (на текущий сайт)
  const isSameOrigin = link.href.startsWith(window.location.origin);
  const hasTarget = link.hasAttribute('target');
  
  if (isSameOrigin && !hasTarget) {
    event.preventDefault();
    const url = new URL(link.href);
    navigateTo(url.pathname);
  }
}

/**
 * Обновление мета-тегов страницы
 * @param {string} title - Заголовок страницы
 * @param {string} description - Описание страницы
 */
function updatePageMeta(title, description) {
  document.title = title ? `${title} | Pavlenko.Tech` : 'Pavlenko.Tech';
  
  // Обновление мета-описания
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (metaDescription) {
    metaDescription.setAttribute('content', description || 'Технический блог Павла Павленко');
  }
}

/**
 * Обновление активной ссылки в меню
 * @param {string} pathname - Текущий путь
 */
function updateActiveNavLink(pathname) {
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    const route = link.getAttribute('data-route');
    
    if (route === 'home' && (pathname === '/' || pathname === '')) {
      link.classList.add('active');
    } else if (route === 'tags' && pathname.startsWith('/tags')) {
      link.classList.add('active');
    } else if (route === 'about' && pathname === '/about') {
      link.classList.add('active');
    }
  });
}

/**
 * Очистка кэша и перезагрузка данных
 */
async function refreshContent() {
  clearContentCache();
  await loadAppData();
  handleRouteChange(state.currentRoute || window.location.pathname);
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт для возможного использования в других модулях
export { state, refreshContent }; 