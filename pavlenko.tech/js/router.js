/**
 * Модуль для маршрутизации с использованием History API
 * Обеспечивает навигацию между страницами без полной перезагрузки
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
  window.addEventListener('popstate', (event) => {
    handlePopState();
  });
  
  // Создаем начальное состояние истории, если его еще нет
  if (!window.history.state) {
    const pathname = window.location.pathname;
    window.history.replaceState({ pathname }, document.title, pathname);
  }
  
  // Проверяем, был ли сохранен путь после перезагрузки страницы
  const redirectPath = sessionStorage.getItem('redirectPath');
  if (redirectPath) {
    // Удаляем сохраненный путь
    sessionStorage.removeItem('redirectPath');
    // Заменяем состояние истории без добавления новой записи
    window.history.replaceState({ pathname: redirectPath }, '', redirectPath);
    // Вызываем обработчик для обновления контента
    if (routeChangeHandler) {
      routeChangeHandler(redirectPath);
      return; // Выходим, чтобы избежать двойного вызова для текущего URL
    }
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
  window.history.pushState({ pathname }, '', pathname);
  
  // Вызываем обработчик для обновления контента
  if (routeChangeHandler) {
    routeChangeHandler(pathname);
  }
}

/**
 * Обработка события popstate (когда пользователь нажимает кнопки браузера назад/вперед)
 */
function handlePopState() {
  const pathname = window.location.pathname;
  
  if (routeChangeHandler) {
    routeChangeHandler(pathname);
  }
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