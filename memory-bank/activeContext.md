# Active Context: Текущее состояние проекта

## Текущий фокус
Реализация гибридного рендеринга для поддержки поисковых роботов и Telegram Instant View, а также внедрение системы конфигурации для упрощения кастомизации блога.

## Последние изменения
1. **Реализована система конфигурации** - Создан файл `config.json` и модуль `js/config.js` для централизованного управления настройками блога.
2. **Добавлен гибридный рендеринг** - Реализована система, предоставляющая статические HTML-файлы для поисковых роботов и SPA для обычных пользователей.
3. **Добавлена поддержка Telegram Instant View** - Создан шаблон для Telegram IV и настроена совместимость как с SPA, так и со статическими HTML-файлами.
4. **Улучшен дизайн для мобильных устройств** - Оптимизирован интерфейс для мобильных устройств, включая отключение sticky-header и улучшение отступов списков.
5. **Расширена документация** - Созданы документы по гибридному рендерингу и настройке Telegram Instant View.
6. **Добавлены новые npm-скрипты** - Добавлены скрипты для генерации статических HTML-файлов и полной сборки проекта.
7. **Обновлен .htaccess для обнаружения ботов** - Добавлена логика для определения поисковых роботов и перенаправления на статические HTML-файлы.
8. **Настроена передача метаданных через config.json** - Заголовок, описание, язык и другие метаданные сайта теперь управляются через конфигурацию.
9. **Обновлен GitHub workflow** - Workflow для обновления контента теперь генерирует статические HTML-файлы при каждом обновлении постов или шаблонов.
10. **Обновление библиотеки Marked (22.03.2025)** - Обновили библиотеку marked с версии 5.1.2 до версии 15.0.7 для решения проблем с устаревшими функциями.
11. **Установка расширений для Marked (22.03.2025)** - Добавлены marked-smartypants для типографского форматирования текста и marked-gfm-heading-id для корректной работы ID заголовков и навигации.
12. **Обновление рендерера (22.03.2025)** - Изменили API рендерера в scripts/generate-static.js для совместимости с marked 15.x.
13. **Исправлены оглавления статей (22.03.2025)** - Настроена корректная работа якорных ссылок в оглавлении статей.

## Текущий статус

Статический блог полностью функционален. Основные компоненты работают:
- Генерация индекса статей
- Рендеринг Markdown в HTML
- Генерация статических страниц для SEO и предпросмотра
- Навигация по заголовкам внутри статей

## Приоритетные задачи

1. **Тестирование на мобильных устройствах** - Убедиться, что сайт корректно отображается на разных устройствах.
2. **Оптимизация производительности** - Рассмотреть возможности кэширования для ускорения генерации статического контента.
3. **Автоматическое оглавление** - Добавление автоматической генерации оглавления для статей с использованием функции getHeadingList из marked-gfm-heading-id.

## Активные проблемы
1. **Адаптация для всех браузеров** - Необходимо проверить работу гибридного рендеринга в различных браузерах.
2. **Оптимизация загрузки ресурсов** - Улучшить стратегию загрузки JavaScript и CSS для ускорения первой отрисовки.
3. **Переводы для интерфейса** - Реализовать механизм локализации для элементов интерфейса.

## Следующие шаги
1. **Интегрировать Google Analytics** - Добавить опциональное подключение Google Analytics через конфигурацию.
2. **Расширить систему шаблонов** - Добавить возможность выбора различных тем и шаблонов через конфигурацию.
3. **Добавить механизм комментариев** - Интегрировать систему комментариев (Utterances или Disqus) с настройкой через конфигурацию.
4. **Оптимизировать изображения** - Автоматизировать оптимизацию и адаптивность изображений в статьях.
5. **Улучшить SEO** - Добавить генерацию sitemap.xml и robots.txt.
6. **Реализовать кастомизацию через админ-панель** - Создать простую админ-панель для визуального редактирования конфигурации.

## Активные решения и соображения
1. **Использование чистого JavaScript** - Проект намеренно избегает использования фреймворков для минимизации зависимостей и увеличения скорости загрузки.
2. **Гибридный подход к рендерингу** - Сочетание преимуществ SPA (быстрая навигация) и статических страниц (SEO, совместимость).
3. **Централизованная конфигурация** - Все настройки хранятся в едином файле `config.json` для упрощения кастомизации.
4. **Прогрессивное улучшение** - Сайт должен быть доступен даже при отключенном JavaScript благодаря статическим версиям.
5. **Минимальные зависимости** - Только необходимые npm-пакеты для сохранения скорости загрузки и простоты обслуживания.
6. **Автоматизация через GitHub Actions** - Использование CI/CD для упрощения обновления сайта, индекса статей и генерации статических HTML.
7. **Темный режим** - Поддержка светлой и темной темы с настройкой через конфигурацию.
8. **Telegram интеграция** - Оптимизация для чтения и шаринга статей через Telegram Instant View.
9. **Архитектура рендеринга Markdown** - Использование библиотеки marked с расширениями для эффективной обработки контента.
10. **Подход к оглавлению** - Заголовки получают автоматические ID с помощью marked-gfm-heading-id для удобной навигации. 