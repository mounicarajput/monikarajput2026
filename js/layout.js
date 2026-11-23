import { $$ } from './lib.js';
import { socialLinks, SUN, MOON } from './icons.js';

const LINKS = [['index.html', 'Home'], ['speaking.html', 'Talks'], ['products.html', 'Projects'], ['podcast.html', 'Podcast'], ['articles.html', 'Writing']];
const page = location.pathname.split('/').pop() || 'index.html';

document.body.insertAdjacentHTML('afterbegin', `
  <header class="top"><div class="wrap bar">
    <nav aria-label="Main">${LINKS.map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <button class="theme" id="theme" type="button" role="switch" aria-label="Night mode"><span class="day">${SUN}</span><span class="night">${MOON}</span></button>
  </div></header>`);

document.body.insertAdjacentHTML('beforeend', `
  <footer class="foot"><div class="wrap"><div class="soc">${socialLinks(['GitHub', 'X', 'LinkedIn', 'YouTube', 'Instagram'])}</div></div></footer>`);

// day and night mode, remembered between visits
const root = document.documentElement, switchEl = document.getElementById('theme');
const setTheme = (t) => {
  root.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch {}
  switchEl.setAttribute('aria-checked', t === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#161513' : '#faf9f6');
};
switchEl.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.08 });

// call again after rendering new content
export const reveal = (root = document) => $$('.rv:not(.in)', root).forEach((el) => io.observe(el));
reveal();
