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
    if (routeChangeHandler) {
      routeChangeHandler(window.location.pathname);
    }
  });
  
  // Проверяем, был ли сохранен путь после перезагрузки страницы
  const redirectPath = sessionStorage.getItem('redirectPath');
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath');
    window.history.replaceState(null, '', redirectPath);
    routeChangeHandler?.(redirectPath);
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
  getCurrentRoute 
}; 