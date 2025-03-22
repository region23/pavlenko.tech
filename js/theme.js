/**
 * Theme toggle functionality
 */
(function() {
  // Function to set theme
  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
      
      // Update icons
      const sunIcon = document.querySelector('.sun-icon');
      const moonIcon = document.querySelector('.moon-icon');
      
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
      
      // Update icons
      const sunIcon = document.querySelector('.sun-icon');
      const moonIcon = document.querySelector('.moon-icon');
      
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }
  }
  
  // Initialize theme based on preferences
  function initializeTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem('darkMode');
    
    if (storedPreference === 'true' || (prefersDark && storedPreference === null)) {
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
        const isDarkMode = document.body.classList.contains('dark-mode');
        setTheme(!isDarkMode);
      });
    }
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupThemeToggle();
  });
})(); 