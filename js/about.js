import { reveal } from './layout.js';
import { $, esc, getJSON, bindCopy } from './lib.js';

const { about, roles } = await getJSON('data/profile.json');

$('#intro').textContent = about.intro;

$('#sections').innerHTML = about.sections.map((s) => `
  <section class="block rv">
    <h3>${esc(s.title)}</h3>
    ${s.text.map((t) => `<p>${esc(t)}</p>`).join('')}
    ${s.roles ? `<ul class="roles">${roles.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join('')}</ul>` : ''}
    ${s.link ? `<p><a class="link" href="${s.link[1]}" target="_blank" rel="noopener">${s.link[0]}</a></p>` : ''}
    ${s.img ? `<img class="shot" src="${s.img}" alt="${esc(s.alt)}" width="${s.w}" height="${s.h}" loading="lazy" decoding="async">` : ''}
  </section>`).join('');

$('#media').innerHTML = about.media.map(([t, d, href]) => `
  <li><a href="${href}" target="_blank" rel="noopener">${esc(t)}</a><span>${esc(d)}</span></li>`).join('');

$('#closeTitle').textContent = about.closing[0];
$('#closeText').textContent = about.closing[1];

bindCopy($('#copy'));
reveal();
