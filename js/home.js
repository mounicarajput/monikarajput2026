import { reveal } from './layout.js';
import { $, getJSON, bindCopy } from './lib.js';
import { articleRow } from './rows.js';

const [p, arts] = await Promise.all([getJSON('data/profile.json'), getJSON('data/articles.json')]);

$('#roles').innerHTML = p.roles.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join('');
$('#articles').innerHTML = arts.articles.slice(0, 3).map(articleRow).join('');

bindCopy($('#copy'));
reveal();
