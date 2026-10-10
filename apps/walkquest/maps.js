/**
 * In-house vintage trail maps. Flat shapes only.
 * No geographic data, satellite imagery, or official marks.
 */

import { linePath, nextStop, pointAtMiles, pointsThrough } from './engine/progress.js';

const NAVY = '#0b1a33';
const SAND = '#e6d3b1';
const GOLD = '#f5b724';
const LOCKED = '#9aabbe';

function num(value) {
  return Math.round(value * 10) / 10;
}

function saguaro(x, y, scale) {
  return `<g fill="${SAND}" opacity="0.85" transform="translate(${x} ${y}) scale(${scale})">
    <path d="M0 46 V16 h6 V8 h8 v14 h6 V20 h8 v26 h-8 V28 h-6 v18 H0z"/>
  </g>`;
}

function pine(x, y, scale) {
  return `<g fill="#2f6a52" transform="translate(${x} ${y}) scale(${scale})">
    <path d="M10 0 L18 16 H14 L20 28 H6 L12 16 H8 Z"/>
    <rect x="9" y="28" width="2.5" height="8" fill="#c4a574"/>
  </g>`;
}

function mesa(x, y, w, h) {
  return `<path d="M${x} ${y + h} L${x + 18} ${y} H${x + w - 18} L${x + w} ${y + h} Z" fill="#16345c" stroke="${SAND}" stroke-width="1.2" opacity="0.95"/>`;
}

function decorations(theme) {
  if (theme === 'desert') {
    return `
      <ellipse cx="70" cy="520" rx="90" ry="22" fill="#c4a574" opacity="0.28"/>
      <ellipse cx="250" cy="530" rx="120" ry="18" fill="#c4a574" opacity="0.2"/>
      ${mesa(18, 250, 90, 46)}
      ${mesa(300, 150, 78, 40)}
      ${saguaro(28, 400, 1.15)}
      ${saguaro(348, 330, 0.9)}
      ${saguaro(40, 300, 0.7)}
      <circle cx="336" cy="64" r="16" fill="${GOLD}" opacity="0.9"/>
      <path d="M318 150 h36 M322 158 h28" stroke="${SAND}" stroke-width="1" opacity="0.4"/>
    `;
  }
  if (theme === 'canyon') {
    return `
      <path d="M20 40 H380 L340 120 H60 Z" fill="#1a3d66" opacity="0.85"/>
      <path d="M40 150 H360 L300 250 H100 Z" fill="#8c4a32" opacity="0.55"/>
      <path d="M80 250 H320 L270 340 H130 Z" fill="#a86a3a" opacity="0.4"/>
      <path d="M120 360 C160 348 240 372 280 356" fill="none" stroke="#7eb6c9" stroke-width="4" stroke-linecap="round"/>
      <path d="M20 470 H380 L350 530 H50 Z" fill="#1a3d66" opacity="0.8"/>
      <circle cx="40" cy="48" r="10" fill="${GOLD}" opacity="0.85"/>
    `;
  }
  return `
    <ellipse cx="200" cy="36" rx="70" ry="16" fill="#7eb6c9" opacity="0.8"/>
    <path d="M40 500 H360 V548 H40 Z" fill="#1d4e6f"/>
    <path d="M70 470 Q140 450 200 472 T340 468" fill="none" stroke="#7eb6c9" stroke-width="3" opacity="0.7"/>
    <path d="M250 180 L280 130 L310 180 Z" fill="#3d6b58"/>
    <path d="M270 168 L292 132 L314 168 Z" fill="#2f6a52"/>
    <path d="M80 300 L108 250 L136 300 Z" fill="#8c4a32" opacity="0.7"/>
    <circle cx="332" cy="90" r="11" fill="${GOLD}" opacity="0.85"/>
  `;
}

function labelFor(stop, index, total) {
  if (total > 12) {
    const last = total - 1;
    const show = index === 0 || index === last || index % 4 === 0;
    if (!show) return '';
  }
  const anchor = stop.x > 210 ? 'end' : 'start';
  const x = stop.x > 210 ? -16 : 16;
  return `<text x="${x}" y="4" text-anchor="${anchor}" fill="#ffffff" stroke="${NAVY}" stroke-width="3" paint-order="stroke" font-size="11" font-family="Segoe UI, Tahoma, sans-serif" font-weight="700">${escapeXml(stop.mapLabel || stop.title)}</text>`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function renderMap(campaign, miles, options = {}) {
  const mini = Boolean(options.mini);
  const stops = campaign.stops;
  const next = nextStop(stops, miles);
  const full = linePath(stops);
  const walkedPoints = pointsThrough(stops, miles);
  const walked = walkedPoints.length > 1 ? linePath(walkedPoints) : '';
  const here = pointAtMiles(stops, miles);
  const aria = `${campaign.name} map. ${miles} miles walked. A stylized game map, not for navigation.`;
  const checkpoints = stops.map((stop, index) => {
    const reached = miles >= stop.miles;
    const isNext = next?.id === stop.id;
    const state = reached ? 'reached' : isNext ? 'next' : 'future';
    const fill = reached ? GOLD : NAVY;
    const stroke = reached || isNext ? GOLD : LOCKED;
    const action = options.interactive
      ? ` data-action="open-stop" data-campaign="${campaign.id}" data-stop="${stop.id}" tabindex="0" role="link" aria-label="${escapeXml(stop.title)}"`
      : '';
    const label = mini ? '' : labelFor(stop, index, stops.length);
    const ring = isNext && !mini
      ? `<circle class="pulse-ring" r="8" fill="none" stroke="${GOLD}" stroke-width="2"></circle>`
      : '';
    const hit = options.interactive ? '<circle r="18" fill="transparent"></circle>' : '';
    return `<g class="cp ${state}" data-role="stop" data-stop="${stop.id}" transform="translate(${stop.x} ${stop.y})"${action}>
      ${hit}
      ${ring}
      <circle class="dot" r="${mini ? 4 : 6}" fill="${fill}" stroke="${stroke}" stroke-width="2"></circle>
      ${label}
    </g>`;
  }).join('');

  const frame = mini ? '' : `
    <rect x="8" y="8" width="384" height="544" rx="10" fill="none" stroke="${GOLD}" stroke-width="1.25" opacity="0.7"/>
    <text x="24" y="32" fill="${GOLD}" font-size="13" font-family="Segoe UI, Tahoma, sans-serif" font-weight="800" letter-spacing="1.5">${escapeXml(campaign.name.toUpperCase())}</text>
    <text x="376" y="540" text-anchor="end" fill="${SAND}" font-size="10" font-family="Segoe UI, Tahoma, sans-serif">Not to scale · not for navigation</text>
    <g transform="translate(350 48)" fill="none" stroke="${GOLD}" stroke-width="1.4">
      <circle r="12"/>
      <path d="M0 -10 V10 M-10 0 H10"/>
      <path d="M0 -7 L3 -2 H-3 Z" fill="${GOLD}" stroke="none"/>
    </g>
  `;

  return `<svg class="trail-map${mini ? ' mini' : ''}" data-map="${campaign.id}" viewBox="0 0 400 560" preserveAspectRatio="${mini ? 'xMidYMid slice' : 'xMidYMid meet'}" role="img" aria-label="${escapeXml(aria)}">
    <rect width="400" height="560" rx="${mini ? 12 : 0}" fill="${NAVY}"/>
    ${mini ? '' : decorations(campaign.theme)}
    ${frame}
    <path data-role="rest" d="${full}" fill="none" stroke="${SAND}" stroke-width="${mini ? 3 : 4}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 8" opacity="0.85"/>
    <path data-role="walked" d="${walked}" fill="none" stroke="${GOLD}" stroke-width="${mini ? 4 : 6}" stroke-linecap="round" stroke-linejoin="round"/>
    ${checkpoints}
    <g data-role="marker" transform="translate(${num(here.x)} ${num(here.y)})">
      <circle r="${mini ? 5 : 8}" fill="${NAVY}" stroke="${GOLD}" stroke-width="3"/>
      <circle r="${mini ? 2 : 3}" fill="${GOLD}"/>
    </g>
  </svg>`;
}

export function applyMiles(svg, campaign, miles) {
  const walked = svg.querySelector('[data-role="walked"]');
  const marker = svg.querySelector('[data-role="marker"]');
  const points = pointsThrough(campaign.stops, miles);
  if (walked) walked.setAttribute('d', points.length > 1 ? linePath(points) : '');
  const here = points[points.length - 1];
  if (marker && here) marker.setAttribute('transform', `translate(${num(here.x)} ${num(here.y)})`);
  const next = nextStop(campaign.stops, miles);
  svg.querySelectorAll('[data-role="stop"]').forEach((node) => {
    const stop = campaign.stops.find((item) => item.id === node.getAttribute('data-stop'));
    if (!stop) return;
    const reached = miles >= stop.miles;
    const isNext = next?.id === stop.id;
    node.setAttribute('class', `cp ${reached ? 'reached' : isNext ? 'next' : 'future'}`);
    const dot = node.querySelector('circle.dot');
    if (dot) {
      dot.setAttribute('fill', reached ? GOLD : NAVY);
      dot.setAttribute('stroke', reached || isNext ? GOLD : LOCKED);
    }
  });
}
