export const EMAIL = 'rajputmonika953@gmail.com';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const getJSON = (u) => fetch(u).then((r) => r.json());
export const mail = (subject) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
// escape, and swap spaced dashes in source text for colons and commas
export const clean = (s) => esc(String(s ?? '').replace(/\s[—–]\s/g, ': ').replace(/[—–]/g, ', ').replace(/\s\|\s/g, ', '));
// escape, then turn **bold** into <b>
export const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

export const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
export const parseDate = (d) => {
  const [dd, mm, yy] = d.split('/').map(Number);
  return { m: mm - 1, y: yy, t: Date.UTC(yy, mm - 1, dd) };
};

// filter chips: renders buttons into `el`, calls onPick(value) on click
export function chips(el, values, onPick) {
  el.innerHTML = values.map((v, i) => `<button class="chip" aria-pressed="${i === 0}" data-v="${esc(v)}">${esc(v)}</button>`).join('');
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    $$('.chip', el).forEach((c) => c.setAttribute('aria-pressed', c === b));
    onPick(b.dataset.v);
  });
}

// send a newsletter signup form to Substack with the typed email prefilled
export const bindSignup = (form) => form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = form.email.value.trim();
  open(`https://monikarajput.substack.com/subscribe${v ? `?email=${encodeURIComponent(v)}` : ''}`, '_blank', 'noopener');
});

// make a button copy the email address, then show "Email copied" for a moment
export const bindCopy = (btn) => (btn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    btn.textContent = 'Email copied';
    setTimeout(() => (btn.textContent = 'Copy email'), 1800);
  } catch {
    location.href = `mailto:${EMAIL}`;
  }
});
