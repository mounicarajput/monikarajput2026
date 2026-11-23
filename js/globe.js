import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm';
import { $, $$, esc } from './lib.js';
import { vec, buildMarkers } from './markers.js';

// photo cards beside the globe, each joined to its place by a dashed arrow
const PHOTOS = [
  { coords: [17.385, 78.4867], img: 'images/web/stage.jpg', top: '30%', fit: '50% 55%', label: 'KubeCon India 2025', text: 'Keynote panel, Hyderabad, India' },
  { coords: [9.9312, 76.2673], img: 'images/web/devopsdays.jpg', top: '60%', fit: '25% 72%', label: 'DevOpsDays Kerala 2024', text: 'Kochi, India' },
];

// colours for day and night mode
const look = () => (document.documentElement.dataset.theme === 'dark'
  ? { dark: 1, diffuse: 1.2, mapBrightness: 6, baseColor: [0.3, 0.3, 0.3], markerColor: [0.98, 0.45, 0.09], glowColor: [0.12, 0.12, 0.12] }
  : { dark: 0, diffuse: 1.2, mapBrightness: 6, baseColor: [1, 1, 1], markerColor: [0.76, 0.25, 0.05], glowColor: [0.93, 0.91, 0.88] });

export function startGlobe(talks) {
  const box = $('#globeBox'), canvas = $('#globe'), overlay = $('#overlay'), tip = $('#tip');
  const markers = buildMarkers(talks);
  const total = markers.reduce((s, m) => s + m.count, 0);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const start = vec(22, 78);
  let size = box.clientWidth, phi = Math.atan2(-start[0], start[2]), theta = 0.35;
  let target = null, dragging = false, hovering = false, active = -1, lx = 0, ly = 0;

  // regions panel
  $('#regions').innerHTML = markers.map((m, i) => `<li data-i="${i}"><span>${esc(m.city)}${m.country ? ', ' + esc(m.country) : ''}</span><b>${((m.count / total) * 100).toFixed(1)}%</b></li>`).join('');
  const countries = new Set(markers.map((m) => m.country).filter(Boolean));
  $('#regionNote').textContent = `${talks.length} talks, ${markers.length} cities, ${countries.size} countries`;

  overlay.innerHTML = markers.map((m, i) => `<button class="pin" data-i="${i}" aria-label="${esc(m.city)}"></button>`).join('');
  const pins = $$('.pin', overlay);

  // photo cards and the dashed arrows that join them to the globe
  const world = $('#world');
  world.insertAdjacentHTML('beforeend', `<svg class="lines" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>${PHOTOS.map(() => '<line marker-end="url(#arrow)"/>').join('')}</svg>`
    + PHOTOS.map((p) => `<figure class="mcard" style="top:${p.top}"><div class="im"><img src="${p.img}" alt="" style="object-position:${p.fit}"><b>${p.label}</b></div><figcaption>${p.text}</figcaption></figure>`).join(''));
  const cards = $$('.mcard', world), arrows = $$('.lines line', world);

  // where a lat/lng lands on screen, using the same rotation as the shader
  const project = (lat, lng) => {
    const [x, y, z] = vec(lat, lng), c = Math.cos(theta), e = Math.sin(theta), d = Math.cos(phi), f = Math.sin(phi);
    return { x: (0.5 + (d * x + f * z) * 0.4) * size, y: (0.5 - (f * e * x + c * y - d * e * z) * 0.4) * size, z: -f * c * x + e * y + d * c * z };
  };
  const focus = (lat, lng) => {
    const [x, y, z] = vec(lat, lng);
    target = [Math.atan2(-x, z), Math.atan2(y, Math.hypot(x, z)) * 0.7];
  };
  const select = (i) => {
    active = i;
    pins.forEach((p, k) => p.classList.toggle('on', k === i));
    $$('#regions li').forEach((l, k) => l.classList.toggle('on', k === i));
    if (i < 0) return void tip.classList.remove('show');
    const m = markers[i];
    tip.innerHTML = `<div class="tip-head"><b>${esc(m.city)}</b>${m.country ? `<span>${esc(m.country)}</span>` : ''}</div>
      <div class="tip-stats"><div><small>Talks</small><strong>${m.count}</strong></div><div><small>Latest</small><strong>${m.year}</strong></div></div>
      <p>${esc(m.events[0].name)}${m.events.length > 1 ? `, and ${m.events.length - 1} more` : ''}</p>`;
    tip.classList.add('show');
  };

  const place = () => {
    markers.forEach((m, i) => {
      const p = project(...m.coords), on = p.z > 0.12;
      pins[i].style.cssText = `transform:translate(${p.x}px,${p.y}px);opacity:${on ? 1 : 0};pointer-events:${on ? 'auto' : 'none'}`;
      if (i === active) tip.style.transform = `translate(${Math.min(Math.max(p.x + 22, 8), size - 280)}px,${Math.min(Math.max(p.y - 20, 8), size - tip.offsetHeight - 8)}px)`;
    });
    const w = world.getBoundingClientRect(), bx = box.getBoundingClientRect();
    PHOTOS.forEach((ph, i) => {
      const p = project(...ph.coords), c = cards[i].getBoundingClientRect();
      const x2 = bx.left - w.left + p.x, y2 = bx.top - w.top + p.y;          // the pin
      const x1 = c.left - w.left, y1 = c.top - w.top + c.height * 0.4;       // the card edge
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, k = (len - 11) / len;  // stop just short of the pin
      arrows[i].setAttribute('x1', x1); arrows[i].setAttribute('y1', y1);
      arrows[i].setAttribute('x2', x1 + (x2 - x1) * k); arrows[i].setAttribute('y2', y1 + (y2 - y1) * k);
      arrows[i].style.opacity = p.z > 0.2 ? 1 : 0;
    });
  };

  createGlobe(canvas, {
    devicePixelRatio: dpr, width: size * dpr, height: size * dpr, phi, theta,
    ...look(), mapSamples: 16000,
    markers: markers.map((m) => ({ location: m.coords, size: m.size })),
    onRender(s) {
      if (target) {
        const dp = Math.atan2(Math.sin(target[0] - phi), Math.cos(target[0] - phi));
        phi += dp * 0.08; theta += (target[1] - theta) * 0.08;
        if (Math.abs(dp) < 0.002) target = null;
      } else if (!dragging && !hovering && document.body.dataset.mode === 'world') phi += 0.003;
      Object.assign(s, look());
      s.phi = phi; s.theta = theta; s.width = s.height = size * dpr;
      place();
    },
  });

  pins.forEach((p, i) => {
    p.onmouseenter = () => { hovering = true; select(i); };
    p.onmouseleave = () => { hovering = false; select(-1); };
    p.onclick = () => focus(...markers[i].coords);
  });
  $$('#regions li').forEach((l) => l.addEventListener('click', () => { const i = +l.dataset.i; focus(...markers[i].coords); select(i); }));

  canvas.onpointerdown = (e) => { dragging = true; target = null; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); select(-1); };
  canvas.onpointermove = (e) => {
    if (!dragging) return;
    phi += (e.clientX - lx) / 200; theta = Math.max(-1.1, Math.min(1.1, theta + (e.clientY - ly) / 200));
    lx = e.clientX; ly = e.clientY;
  };
  canvas.onpointerup = canvas.onpointercancel = () => (dragging = false);
  addEventListener('resize', () => (size = box.clientWidth));
}
