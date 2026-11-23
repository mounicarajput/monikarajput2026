import { reveal } from './layout.js';
import { $, getJSON, chips, clean, MONTHS } from './lib.js';
import { picRow } from './rows.js';

const eps = await getJSON('data/podcasts.json');
const thumb = (e) => (e.platform === 'youtube' ? `https://img.youtube.com/vi/${e.id}/mqdefault.jpg` : 'images/web/stage.jpg');
const when = (e) => (e.date ? `${MONTHS[+e.date.slice(5, 7) - 1]} ${e.date.slice(0, 4)}` : '');
const kicker = (e) => [e.show, e.episode, when(e), e.length].filter(Boolean).join(', ');

const draw = (show) => {
  $('#episodes').innerHTML = eps.filter((e) => show === 'All' || e.show === show).map((e) => picRow({
    href: e.url, img: thumb(e), kicker: kicker(e), title: e.title, text: e.description,
  })).join('');
  reveal();
};
const shows = [...new Set(eps.map((e) => e.show))].sort((a, b) => (b === 'The Monika Rajput Show') - (a === 'The Monika Rajput Show'));
chips($('#shows'), ['All', ...shows], draw);
draw('All');

// the newest full episode is featured; its video loads only when asked, so the page stays light
const latest = eps.find((e) => e.show === 'The Monika Rajput Show' && e.platform === 'youtube');
const embed = $('#latest');
$('#latestTitle').innerHTML = `${clean(latest.title)} <span class="muted">${when(latest)}</span>`;
embed.innerHTML = `<button type="button" aria-label="Play the latest episode"><img src="https://img.youtube.com/vi/${latest.id}/hqdefault.jpg" alt="" width="480" height="360"><span>Play the latest episode</span></button>`;
embed.addEventListener('click', () => {
  embed.innerHTML = `<iframe src="https://www.youtube.com/embed/${latest.id}?autoplay=1&rel=0" title="${latest.title.replace(/"/g, '')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}, { once: true });
