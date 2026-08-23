const themeToggle = document.querySelector('#theme-toggle');

function themeIcon(theme) {
  if (theme === 'dark') return '<svg aria-hidden="true" viewBox="0 0 24 24" class="size-4 fill-none stroke-current" stroke-width="1.8"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>';
  return '<svg aria-hidden="true" viewBox="0 0 24 24" class="size-4 fill-none stroke-current" stroke-width="1.8"><path d="M20 15.2A8 8 0 0 1 8.8 4a8 8 0 1 0 11.2 11.2Z"/></svg>';
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeToggle.innerHTML = themeIcon(theme);
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  localStorage.setItem('theme', theme);
}

applyTheme(localStorage.getItem('theme') || 'dark');
themeToggle.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
