import { reveal } from './layout.js';
import { $, getJSON } from './lib.js';

const { projects } = await getJSON('data/profile.json');

$('#projects').innerHTML = projects.map((x) => `
  <div class="proj rv">
    ${x.img ? `<a href="${x.url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="${x.img}" alt="" width="240" height="150" loading="lazy" decoding="async"></a>` : '<div class="ph" aria-hidden="true">&#8377;</div>'}
    <div><h3><a href="${x.url}"${x.url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${x.name}</a></h3><p class="tag">${x.status}</p><p class="muted">${x.text}</p></div>
  </div>`).join('');
reveal();
