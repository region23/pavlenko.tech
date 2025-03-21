// Импорт модулей
import { initRouter, navigateTo } from './router.js';
import { fetchContentList, fetchContent, processFrontmatter } from './content.js';
import { renderPostList, renderPost, renderTagsList, renderAbout, renderError } from './ui.js';

// Состояние приложения
const state = {
  posts: [],
  tags: {},
  currentRoute: null
};

// Инициализация приложения
async function initApp() {
  try {
    console.log("Инициализация приложения");
    // Загрузка списка статей
    const posts = await fetchContentList('content/posts');
    
    if (posts && posts.length > 0) {
      // Сортировка статей по дате (сначала новые)
      state.posts = posts.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      // Формирование списка тегов
      state.tags = {};
      
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            if (!state.tags[tag]) {
              state.tags[tag] = 0;
            }
            state.tags[tag]++;
          });
        }
      });
      
      console.log(`Загружено ${posts.length} статей`);
    }
    
    // Инициализация роутера
    initRouter(handleRouteChange);
    
    // Первоначальная обработка текущего URL
    handleRouteChange(window.location.pathname);
    
    // Обработка кликов по навигационным ссылкам
    document.addEventListener('click', handleNavigation);
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    renderError('Ошибка загрузки данных. Пожалуйста, обновите страницу.');
  }
}

// Обработка изменения маршрута
async function handleRouteChange(pathname) {
  console.log(`Обработка маршрута: ${pathname}`);
  const contentElement = document.getElementById('content');
  contentElement.innerHTML = '<div class="loader">Загрузка...</div>';
  
  // Обновление текущего маршрута
  state.currentRoute = pathname;
  
  try {
    // Обработка разных маршрутов
    if (pathname === '/' || pathname === '') {
      // Главная страница - список статей
      renderPostList(state.posts, contentElement);
      updatePageMeta('Технический блог', 'Блог о разработке и технологиях');
    } 
    else if (pathname.startsWith('/posts/')) {
      // Страница отдельной статьи
      const slug = pathname.split('/posts/')[1];
      
      if (slug) {
        console.log(`Поиск статьи по slug: ${slug}`);
        const postData = state.posts.find(post => {
          const postSlug = post.slug || post.path.split('/').pop().replace('.md', '');
          return postSlug === slug;
        });
        
        if (postData) {
          console.log(`Статья найдена: ${postData.title}, путь: ${postData.path}`);
          // Загружаем контент статьи напрямую из файла
          try {
            // Корректный путь к файлу
            const postPath = postData.path || `content/posts/${slug}.md`;
            console.log(`Загрузка файла по пути: ${postPath}`);
            
            const postContent = await fetchContent(postPath);
            
            if (postContent) {
              renderPost(postData, postContent, contentElement);
              updatePageMeta(postData.title, postData.summary || '');
            } else {
              console.error(`Содержимое статьи не найдено: ${postPath}`);
              renderError('Статья не найдена', contentElement);
              updatePageMeta('Статья не найдена', 'Запрашиваемая статья не существует');
            }
          } catch (error) {
            console.error('Ошибка при загрузке статьи:', error);
            renderError('Ошибка при загрузке статьи', contentElement);
          }
        } else {
          console.error(`Статья не найдена по slug: ${slug}`);
          renderError('Статья не найдена', contentElement);
          updatePageMeta('Статья не найдена', 'Запрашиваемая статья не существует');
        }
      }
    }
    else if (pathname === '/tags') {
      // Страница с тегами
      renderTagsList(state.tags, contentElement);
      updatePageMeta('Теги', 'Список всех тегов');
    }
    else if (pathname.startsWith('/tags/')) {
      // Страница отдельного тега
      const tag = pathname.split('/tags/')[1];
      
      if (tag) {
        const filteredPosts = state.posts.filter(post => 
          post.tags && post.tags.includes(tag)
        );
        
        renderPostList(filteredPosts, contentElement, `Статьи с тегом: ${tag}`);
        updatePageMeta(`Тег: ${tag}`, `Статьи с тегом ${tag}`);
      }
    }
    else if (pathname === '/about') {
      // Страница about
      const aboutContent = await fetchContent('content/about/index.md');
      
      if (aboutContent) {
        const aboutData = processFrontmatter(aboutContent) || {};
        renderAbout(aboutData, contentElement);
        updatePageMeta('About', aboutData.title || 'Обо мне');
      } else {
        renderError('Информация не найдена', contentElement);
        updatePageMeta('About', 'Информация об авторе');
      }
    }
    else {
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
  }
}

// Обработка кликов по ссылкам для навигации
function handleNavigation(event) {
  const link = event.target.closest('a');
  
  if (link && link.href && link.href.startsWith(window.location.origin) && !link.hasAttribute('target')) {
    event.preventDefault();
    
    const url = new URL(link.href);
    navigateTo(url.pathname);
  }
}

// Обновление мета-тегов страницы
function updatePageMeta(title, description) {
  document.title = title ? `${title} | Pavlenko.tech` : 'Pavlenko.tech';
  
  // Обновление мета-описания
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (metaDescription) {
    metaDescription.setAttribute('content', description || 'Технический блог');
  }
}

// Обновление активной ссылки в меню
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

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт для возможного использования в других модулях
export { state, handleRouteChange }; 