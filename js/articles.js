import { reveal } from './layout.js';
import { $, getJSON, chips } from './lib.js';
import { articleRow } from './rows.js';

const { articles } = await getJSON('data/articles.json');

const draw = (cat) => {
  $('#articles').innerHTML = articles.filter((a) => cat === 'All' || a.category === cat).map(articleRow).join('');
  reveal();
};
chips($('#cats'), ['All', ...new Set(articles.map((a) => a.category))], draw);
draw('All');
