/**
 * Простой клиентский роутер с использованием History API
 */

// Функция обработки маршрута, будет установлена при инициализации
let routeChangeHandler = null;

/**
 * Инициализация роутера
 * @param {Function} handler - Функция обработки изменения маршрута
 */
function initRouter(handler) {
  if (typeof handler !== 'function') {
    throw new Error('Обработчик маршрута должен быть функцией');
  }
  
  // Установка обработчика
  routeChangeHandler = handler;
  
  // Обработка события popstate (перемещение по истории браузера)
  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    console.log(`Навигация по истории: ${path}`);
    if (routeChangeHandler) {
      routeChangeHandler(path);
    }
  });
  
  // Проверяем, был ли сохранен путь после перезагрузки страницы
  const redirectPath = sessionStorage.getItem('redirectPath');
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath');
    window.history.replaceState(null, '', redirectPath);
    console.log(`Перенаправление на сохраненный путь: ${redirectPath}`);
    routeChangeHandler?.(redirectPath);
  }
  
  // Инициализация обработчика кликов для всего документа
  document.addEventListener('click', handleNavigation);
}

/**
 * Обработка навигации по ссылкам
 * @param {Event} event - Событие клика
 */
function handleNavigation(event) {
  // Проверяем, что клик был по ссылке
  const target = event.target.closest('a');
  if (!target) return;
  
  // Получаем href ссылки
  const href = target.getAttribute('href');
  
  // Пропускаем внешние ссылки и ссылки с модификаторами
  if (!href || 
      href.startsWith('http') || 
      href.startsWith('mailto:') || 
      href.startsWith('tel:') ||
      target.hasAttribute('download') ||
      target.getAttribute('target') === '_blank' ||
      event.ctrlKey || 
      event.metaKey) {
    return;
  }
  
  // Предотвращаем стандартное поведение ссылки
  event.preventDefault();
  
  // Если ссылка отличается от текущего пути
  if (href !== window.location.pathname) {
    console.log(`Навигация по ссылке: ${href}`);
    navigateTo(href);
  }
}

/**
 * Навигация к указанному пути
 * @param {string} pathname - Путь, к которому нужно перейти
 */
function navigateTo(pathname) {
  // Если мы уже на этой странице, ничего не делаем
  if (window.location.pathname === pathname) {
    return;
  }
  
  // Добавляем новое состояние в историю браузера
  window.history.pushState(null, '', pathname);
  console.log(`Переход на: ${pathname}`);
  
  // Вызываем обработчик для обновления контента
  routeChangeHandler?.(pathname);
}

/**
 * Получение параметров из URL
 * @param {string} url - URL-адрес для анализа
 * @returns {Object} - Объект с параметрами
 */
function getUrlParams(url) {
  const params = {};
  const urlObj = new URL(url, window.location.origin);
  
  for (const [key, value] of urlObj.searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Получение текущего маршрута
 * @returns {string} - Текущий путь
 */
function getCurrentRoute() {
  return window.location.pathname;
}

// Экспортируем публичные функции
export { 
  initRouter, 
  navigateTo, 
  getUrlParams, 
  getCurrentRoute,
  handleNavigation
}; 