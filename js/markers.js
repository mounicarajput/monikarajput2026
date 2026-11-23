import { parseDate } from './lib.js';

export const CITY = {
  Gurugram: [28.4595, 77.0266], Noida: [28.5355, 77.391], Delhi: [28.6139, 77.209],
  Bengaluru: [12.9716, 77.5946], Kochi: [9.9312, 76.2673], Lagos: [6.5244, 3.3792],
  'Hong Kong': [22.3193, 114.1694], Kathmandu: [27.7172, 85.324], Leipzig: [51.3397, 12.3731],
  'Santa Clara': [37.3541, -121.9552], 'Salt Lake City': [40.7608, -111.891], Hyderabad: [17.385, 78.4867],
};

// cities that make up the Delhi region, shown as one place on the globe
const NCR = ['Gurugram', 'Noida', 'Delhi'];

// lat/lng to a point on the unit sphere, in the same convention the globe shader uses
export const vec = (lat, lng) => {
  const r = (lat * Math.PI) / 180, a = (lng * Math.PI) / 180 - Math.PI, c = Math.cos(r);
  return [-c * Math.cos(a), Math.sin(r), c * Math.sin(a)];
};
const chord = (p, q) => Math.hypot(...vec(...p).map((v, i) => v - vec(...q)[i]));

// group talks by city, then fold nearby cities into the busiest one
export function buildMarkers(talks) {
  const byCity = {};
  for (const t of talks) {
    if (!t.location || /\(Online\)/.test(t.event)) continue;
    const [city, country = ''] = t.location.split(',').map((s) => s.trim());
    if (!CITY[city]) continue;
    const d = parseDate(t.date);
    const m = (byCity[city] ||= { city, country, coords: CITY[city], count: 0, events: [], latest: 0, cities: [city] });
    m.count++;
    m.events.push({ name: t.title || t.event, t: d.t });
    m.latest = Math.max(m.latest, d.t);
  }
  const out = [];
  for (const c of Object.values(byCity).sort((a, b) => b.count - a.count || b.latest - a.latest)) {
    const host = out.find((o) => chord(o.coords, c.coords) < 0.01);
    if (!host) { out.push(c); continue; }
    host.count += c.count;
    host.cities.push(...c.cities);
    host.events.push(...c.events);
    host.latest = Math.max(host.latest, c.latest);
  }
  out.forEach((o) => {
    if (o.cities.length > 1 && o.cities.every((c) => NCR.includes(c))) o.city = 'Delhi NCR';
    o.events.sort((a, b) => b.t - a.t);
    o.year = new Date(o.latest).getUTCFullYear();
    o.size = o.count >= 10 ? 0.07 : o.count >= 2 ? 0.045 : 0.03;
  });
  return out;
}
