# Technical Context: Технологии и инструменты

## Основные технологии
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Хранение данных**: Markdown-файлы, JSON для индекса
- **Автоматизация**: Node.js, GitHub Actions
- **Хостинг**: GitHub Pages

## Зависимости
### Производственные
- Минимальный набор библиотек, основной код написан на vanilla JavaScript
- Markdown-парсер (встроенный в клиентский код)

### Разработка и инфраструктура
- Node.js (для скрипта генерации индекса)
- `serve` (для локальной разработки)

## Настройка окружения разработки
```bash
# Клонирование репозитория
git clone https://github.com/region23/pavlenko.tech.git
cd pavlenko.tech

# Установка зависимостей
npm install

# Запуск локального сервера разработки
npm start

# Обновление индекса статей
npm run update-index

# Упрощенный деплой
npm run deploy
```

## Структура системы
```
/
├── .github/
│   └── workflows/
│       ├── update-index.yml    # GitHub Actions для обновления индекса
│       └── github-pages.yml    # GitHub Actions для деплоя на GitHub Pages
├── .cursor/
│   └── rules/                  # Правила для IDE Cursor
├── content/
│   ├── about/
│   │   └── index.md            # Информация о блоге/авторе
│   └── posts/
│       ├── index.json          # Индекс всех статей
│       ├── example-post.md     # Статьи в формате Markdown
│       └── hello-world.md
├── css/
│   └── style.css               # Стили сайта
├── js/
│   ├── app.js                  # Основной JS-код
│   ├── content.js              # Работа с контентом
│   ├── router.js               # Маршрутизация
│   └── ui.js                   # Пользовательский интерфейс
├── images/                     # Изображения для сайта
├── memory-bank/                # Документация проекта
│   ├── activeContext.md
│   ├── productContext.md
│   ├── progress.md
│   ├── projectbrief.md
│   ├── systemPatterns.md
│   └── techContext.md
├── scripts/
│   └── generate-index.js       # Скрипт для обновления индекса
├── .gitignore                  # Исключения для Git
├── .htaccess                   # Правила перенаправления для Apache
├── .nojekyll                   # Отключение обработки Jekyll для GitHub Pages
├── 404.html                    # Страница 404
├── _redirects                  # Правила перенаправления для Netlify
├── favicon.ico                 # Иконка сайта
├── index.html                  # Главная страница (SPA)
├── package.json                # Зависимости и скрипты
└── README.md                   # Документация проекта
```

## Рабочие процессы и инструменты

### Локальная разработка
1. Запуск сервера: `npm start`
2. Обновление индекса: `npm run update-index`
3. Просмотр в браузере по адресу: `http://localhost:3000`

### Деплой
1. Автоматический через GitHub:
   - Коммит изменений: `git commit -m "Сообщение"`
   - Пуш изменений: `git push origin master`
   - GitHub Actions автоматически обновит индекс
   - GitHub Pages автоматически обновит сайт

2. Упрощенный через npm-скрипт:
   - `npm run deploy` (объединяет add, commit и push)

### Обновление контента
1. Создание/редактирование .md файлов
2. Использование frontmatter для метаданных
3. Автоматическое обновление индекса при пуше

## Технические ограничения
- Отсутствие серверной обработки (только статические файлы)
- Все данные должны быть подготовлены заранее или загружены на клиенте
- Необходимость прямого доступа к файлам .md для чтения их содержимого
- Ограничения GitHub Pages (только статический контент)

## Инструменты разработки
- Visual Studio Code / Cursor - основной редактор кода
- Git - система контроля версий
- npm - менеджер пакетов
- GitHub - хостинг репозитория и CI/CD 