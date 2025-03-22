/**
 * Модуль для работы с конфигурацией сайта
 */

// Значения конфигурации по умолчанию
const defaultConfig = {
  site: {
    title: "Pavlenko.Tech",
    description: "Авторский блог Павла Павленко про разработку и AI",
    language: "ru",
    copyright: "© 2025 Pavlenko.Tech"
  },
  navigation: {
    items: [
      {
        label: "Blog",
        url: "/"
      },
      {
        label: "Tags",
        url: "/tags"
      },
      {
        label: "About",
        url: "/about"
      }
    ]
  },
  social: {
    links: [
      {
        name: "GitHub",
        url: "https://github.com/pavlenko"
      },
      {
        name: "Twitter",
        url: "https://twitter.com/pavlenko"
      },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/pavlenko"
      }
    ]
  },
  appearance: {
    colors: {
      primary: "#3f51b5",
      secondary: "#ff4081",
      accent: "#00bcd4",
      background: "#ffffff",
      surface: "#f5f5f5",
      text: "#212121",
      border: "#e0e0e0"
    },
    darkMode: {
      background: "#121212",
      surface: "#1e1e1e",
      text: "#ffffff",
      border: "#333333"
    },
    fonts: {
      main: "Inter",
      code: "JetBrains Mono"
    }
  },
  content: {
    postsPerPage: 10,
    showReadingTime: true,
    defaultAuthor: "Pavel Pavlenko",
    wordsPerMinute: 200
  }
};

// Текущая конфигурация (будет заполнена после загрузки)
let currentConfig = { ...defaultConfig };

/**
 * Загрузка конфигурации из JSON-файла
 * @returns {Promise<Object>} - Загруженная конфигурация
 */
async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    
    if (!response.ok) {
      console.warn('Failed to load config.json, using default configuration');
      return defaultConfig;
    }
    
    const loadedConfig = await response.json();
    currentConfig = deepMerge(defaultConfig, loadedConfig);
    
    console.log('Configuration loaded successfully');
    return currentConfig;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return defaultConfig;
  }
}

/**
 * Получение значения из конфигурации по пути
 * @param {string} path - Путь к значению в формате "section.subsection.property"
 * @param {*} defaultValue - Значение по умолчанию, если путь не найден
 * @returns {*} - Значение из конфигурации или значение по умолчанию
 */
function get(path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = currentConfig;
  
  for (const key of keys) {
    if (result === undefined || result === null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Глубокое объединение объектов
 * @param {Object} target - Целевой объект
 * @param {Object} source - Исходный объект
 * @returns {Object} - Объединенный объект
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * Проверка, является ли значение объектом
 * @param {*} item - Проверяемое значение
 * @returns {boolean} - true, если значение является объектом
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Применение цветовой схемы из конфигурации к CSS-переменным
 */
function applyThemeColors() {
  const colors = get('appearance.colors');
  const darkModeColors = get('appearance.darkMode');
  const root = document.documentElement;
  
  // Применяем основные цвета
  if (colors) {
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}-color`, value);
    });
  }
  
  // Задаем переменные для темного режима
  if (darkModeColors) {
    Object.entries(darkModeColors).forEach(([key, value]) => {
      root.style.setProperty(`--dark-${key}`, value);
    });
  }
}

/**
 * Применение шрифтов из конфигурации
 */
function applyFonts() {
  const fonts = get('appearance.fonts');
  const root = document.documentElement;
  
  if (fonts) {
    if (fonts.main) {
      root.style.setProperty('--font-sans', `'${fonts.main}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`);
    }
    
    if (fonts.code) {
      root.style.setProperty('--font-mono', `'${fonts.code}', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace`);
    }
  }
}

// Экспортируем публичные функции
export {
  loadConfig,
  get,
  applyThemeColors,
  applyFonts
}; 