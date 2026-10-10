/**
 * Square postcard drawn on a canvas so it can be saved or shared.
 * Miles and a place name only. No body info.
 */

import { formatDistance } from './engine/convert.js';
import { pointAtMiles, pointsThrough } from './engine/progress.js';

const NAVY = '#0b1a33';
const GOLD = '#f5b724';
const SAND = '#e6d3b1';

function fit(stops, box) {
  const xs = stops.map((stop) => stop.x);
  const ys = stops.map((stop) => stop.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  return (point) => ({
    x: box.x + ((point.x - minX) / spanX) * box.w,
    y: box.y + ((point.y - minY) / spanY) * box.h,
  });
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawPostcard(canvas, model) {
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, size - 72, size - 72);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, size - 104, size - 104);

  ctx.fillStyle = GOLD;
  ctx.font = '800 54px "Segoe UI", Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WALKQUEST', 88, 140);
  ctx.fillStyle = SAND;
  ctx.font = '600 28px "Segoe UI", Tahoma, sans-serif';
  ctx.fillText('by LoadLine Fitness', 88, 182);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(88, 214);
  ctx.lineTo(size - 88, 214);
  ctx.stroke();

  ctx.fillStyle = SAND;
  ctx.font = '700 26px "Segoe UI", Tahoma, sans-serif';
  ctx.fillText(model.campaignName.toUpperCase(), 88, 268);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Segoe UI", Tahoma, sans-serif';
  const titleLines = wrap(ctx, model.stopTitle, 900);
  titleLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 88, 350 + index * 74);
  });

  const box = { x: 160, y: 500, w: 760, h: 280 };
  ctx.fillStyle = '#10243f';
  ctx.fillRect(box.x - 24, box.y - 24, box.w + 48, box.h + 48);
  const project = fit(model.stops, box);
  const all = model.stops.map(project);
  ctx.strokeStyle = SAND;
  ctx.lineWidth = 4;
  ctx.setLineDash([2, 10]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  all.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.stroke();
  ctx.setLineDash([]);

  const walked = pointsThrough(model.stops, model.miles).map(project);
  if (walked.length > 1) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 8;
    ctx.beginPath();
    walked.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
    ctx.stroke();
  }
  const here = project(pointAtMiles(model.stops, model.miles));
  ctx.fillStyle = NAVY;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(here.x, here.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Segoe UI", Tahoma, sans-serif';
  ctx.fillText(model.trailName, 88, 900);
  ctx.fillStyle = GOLD;
  ctx.font = '800 36px "Segoe UI", Tahoma, sans-serif';
  ctx.fillText(formatDistance(model.miles, model.units), 88, 952);

  ctx.fillStyle = SAND;
  ctx.font = '600 22px "Segoe UI", Tahoma, sans-serif';
  ctx.fillText('Game map, not for navigation.', 88, 1004);
}
