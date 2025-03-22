// Мобильное меню
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
      menuToggle.classList.toggle('active');
      
      // Доступность
      const expanded = navLinks.classList.contains('show');
      menuToggle.setAttribute('aria-expanded', expanded);
    });
    
    // Закрытие меню при клике по ссылке
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Закрытие меню при клике вне меню
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#nav-links') && 
          !event.target.closest('#menu-toggle') && 
          navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}); 