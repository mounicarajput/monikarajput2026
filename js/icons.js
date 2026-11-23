// social links shown in the header as round icon buttons
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${d}"/></svg>`;

export const SOCIALS = [
  ['GitHub', 'https://github.com/mounicarajput', svg('M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-3 .7-3.6-1.3-3.6-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.5 1.1 3.1.8.1-.6.4-1.1.7-1.4-2.4-.3-5-1.2-5-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 .1a10.4 10.4 0 0 1 5.4 0c2.1-.4 3-.1 3-.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.6 5.1-5 5.4.4.3.8 1 .8 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2Z')],
  ['X', 'https://x.com/mounicarajput', svg('M18.6 3H21l-5.3 6.1L22 21h-5l-3.9-5.7L8 21H5.6l5.8-6.7L2 3h5.1l3.6 5.2L15.2 3h3.4Z')],
  ['LinkedIn', 'https://www.linkedin.com/in/mounicarajput/', svg('M6.5 6.8A2.3 2.3 0 1 1 6.5 2.2a2.3 2.3 0 0 1 0 4.6ZM4.5 21V9h4v12h-4Zm6.5-12h3.8v1.6h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9Z')],
  ['YouTube', 'https://www.youtube.com/@mounicarajput', svg('M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 9.2v5.6l5-2.8-5-2.8Z')],
  ['Instagram', 'https://www.instagram.com/mounicarajput', svg('M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8ZM17.2 5.8a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z')],
];

export const socialLinks = (only) => SOCIALS.filter(([name]) => !only || only.includes(name)).map(([name, href, icon]) =>
  `<a href="${href}" target="_blank" rel="noopener" aria-label="${name}" title="${name}">${icon}</a>`).join('');

// day and night switch icons
const line = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
export const SUN = line('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
export const MOON = line('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
