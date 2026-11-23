import { clean, esc, parseDate, MONTHS } from './lib.js';

const a = (href, inner) => (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : inner);

// a talk: label on the left (month or year), title and event, then place and summary
export const talkRow = (t, label) => `
  <li class="row rv"><time>${label}</time><div>
    <h3>${a(t.link || t.url, clean(t.title || t.event))}${t.title ? ` <span class="muted">| ${clean(t.event)}</span>` : ''}</h3>
    ${t.location ? `<p>${esc(t.location)}</p>` : ''}${t.description ? `<p>${clean(t.description)}</p>` : ''}
  </div></li>`;

export const monthLabel = (t) => MONTHS[parseDate(t.date).m];

// an item with a thumbnail, used for episodes and articles
export const picRow = ({ href, img, contain, kicker, title, text }) => `
  <li class="row pic rv"><a href="${esc(href)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
    <img src="${esc(img)}" alt="" width="168" height="105" loading="lazy" decoding="async"${contain ? ' class="contain"' : ''}></a>
    <div><p>${clean(kicker)}</p><h3>${a(href, clean(title))}</h3><p>${clean(text)}</p></div></li>`;

// an article: thumbnail when it has one, plain dated row when it does not
export const articleRow = (x) => (x.image
  ? picRow({ href: x.link, img: x.image, contain: true, kicker: `${x.category}, ${x.date}`, title: x.title, text: x.description })
  : `<li class="row rv"><time>${x.date.slice(-4)}</time><div><h3>${a(x.link, clean(x.title))}</h3><p>${clean(x.category)}, ${clean(x.date)}</p><p>${clean(x.description)}</p></div></li>`);
