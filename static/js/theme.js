/**
 * Theme toggle functionality
 */
(function() {
  // Function to set theme
  function setTheme(isDark) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      
      // Update icon
      const themeToggleIcon = document.querySelector('.theme-toggle-icon');
      if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      
      // Update icon
      const themeToggleIcon = document.querySelector('.theme-toggle-icon');
      if (themeToggleIcon) themeToggleIcon.textContent = '🌙';
    }
  }
  
  // Initialize theme based on preferences
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme(true);
    } else {
      setTheme(false);
    }
  }
  
  // Setup event listener for theme toggle
  function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Обновляем иконку
        const themeToggleIcon = themeToggle.querySelector('.theme-toggle-icon');
        if (themeToggleIcon) themeToggleIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Анимация перехода
        document.documentElement.classList.add('theme-transition');
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 300);
      });
    }
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupThemeToggle();
  });
})(); 