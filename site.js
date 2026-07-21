const root = document.documentElement;
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const themeButton = document.querySelector('.theme-toggle');
const breatheButton = document.querySelector('.breathe-start');
const breathVisual = document.querySelector('.breath-visual');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation?.classList.toggle('is-open', open);
});

themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('zen-tips-theme', next);
});

const savedTheme = localStorage.getItem('zen-tips-theme');
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;

breatheButton?.addEventListener('click', () => {
  if (!breathVisual) return;
  const label = breathVisual.querySelector('strong');
  breathVisual.classList.remove('is-active');
  void breathVisual.offsetWidth;
  breathVisual.classList.add('is-active');
  breatheButton.disabled = true;

  const stages = [
    [0, 'Inhale'],
    [4000, 'Hold'],
    [11000, 'Exhale'],
    [19000, 'Complete'],
  ];

  for (const [delay, text] of stages) {
    window.setTimeout(() => {
      if (label) label.textContent = text;
      if (text === 'Complete') breatheButton.disabled = false;
    }, delay);
  }
});
