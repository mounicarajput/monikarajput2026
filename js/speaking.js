import { reveal } from './layout.js';
import { $, getJSON, parseDate } from './lib.js';
import { talkRow, monthLabel } from './rows.js';

const talks = await getJSON('data/talks.json');
const desktop = matchMedia('(min-width: 1024px)').matches;
let query = '', recordedOnly = false;

// list view, grouped by year
function drawList() {
  const q = query.toLowerCase().trim();
  const shown = talks.filter((t) => (!recordedOnly || t.link)
    && (!q || [t.title, t.event, t.description, t.location].some((f) => (f || '').toLowerCase().includes(q))));
  const years = {};
  shown.forEach((t) => (years[parseDate(t.date).y] ||= []).push(t));
  $('#count').textContent = `${shown.length} ${shown.length === 1 ? 'talk' : 'talks'}${q || recordedOnly ? ', filtered' : ''}`;
  $('#results').textContent = `${shown.length} results`;
  $('#years').innerHTML = Object.keys(years).sort((a, b) => b - a).map((y) => `
    <section class="year"><h2>${y} <span class="muted">(${years[y].length} events)</span></h2>
    <ul>${years[y].sort((a, b) => parseDate(b.date).t - parseDate(a.date).t).map((t) => talkRow(t, monthLabel(t))).join('')}</ul></section>`).join('')
    || '<p class="muted">No talks found.</p>';
  reveal();
}

// world and list views
const setMode = (m) => { document.body.dataset.mode = m; scrollTo(0, 0); };
$('#toList').onclick = () => setMode('list');
$('#toWorld').onclick = () => setMode('world');
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('#search').classList.contains('open')) $('#search').classList.remove('open');
  else if (document.body.dataset.mode === 'world') setMode('list');
});

// search
const box = $('#search'), input = $('#q');
$('#openSearch').onclick = () => { box.classList.add('open'); input.focus(); };
box.onclick = (e) => { if (e.target === box) box.classList.remove('open'); };
input.oninput = () => { query = input.value; drawList(); };
$('#recorded').onclick = (e) => { recordedOnly = !recordedOnly; e.target.setAttribute('aria-pressed', recordedOnly); drawList(); };

const view = new URLSearchParams(location.search).get('view');
document.body.dataset.mode = desktop && view !== 'list' ? 'world' : 'list';
drawList();

// the globe is heavy, so it only loads on large screens
if (desktop) import('./globe.js').then((g) => g.startGlobe(talks)).catch(() => setMode('list'));
