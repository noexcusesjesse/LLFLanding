// LoadLine Program Disclaimer and Consent (/disclaimer).
// Copy lives verbatim in site-v5/content/disclaimer.md; this file only turns
// that markdown into the v5 page markup. Do not edit copy here.
import { readFileSync } from 'node:fs';

export const DISCLAIMER_MD = readFileSync(new URL('./content/disclaimer.md', import.meta.url), 'utf8');
// Fasting Safety (/fasting-safety). Copy lives verbatim in site-v5/content/fasting-safety.md.
export const FASTING_SAFETY_MD = readFileSync(new URL('./content/fasting-safety.md', import.meta.url), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (s) => s.toLowerCase().replace(/^\d+\.\s*/, (m) => `s${m.trim().replace('.', '')}-`).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Inline: **bold**, *italic*, [text](href).
function inline(src) {
  let s = esc(src);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h.replace(/"/g, '%22')}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  return s;
}

// Returns { h1, lead, sections } where sections is HTML for the body.
// leadRe picks the block right after the h1 that becomes the hero subline.
export function renderDisclaimer(md = DISCLAIMER_MD, leadRe = /^\*\*Effective date:\*\*/) {
  const blocks = md.replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n{2,}/);
  let h1 = '';
  let lead = '';
  const out = [];
  let open = false; // inside a <section>
  const close = () => { if (open) { out.push('</section>'); open = false; } };
  for (const raw of blocks) {
    const b = raw.trim();
    if (b.startsWith('# ')) { h1 = inline(b.slice(2)); continue; }
    if (!h1 || (!lead && !out.length && leadRe.test(b))) { lead = inline(b); continue; }
    if (b.startsWith('## ')) {
      close();
      const t = b.slice(3);
      const id = slug(t);
      const ack = /^Acknowledgment/.test(t);
      out.push(`<section class="dl-sec${ack ? ' dl-ack' : ''}" aria-labelledby="${id}"><h2 id="${id}">${inline(t)}</h2>`);
      open = true;
      continue;
    }
    if (b === '---') { close(); continue; }
    const lines = b.split('\n');
    if (lines.every((l) => /^- \[ \] /.test(l))) {
      out.push(`<ul class="checks dl-checks">${lines.map((l) => `<li>${inline(l.slice(6))}</li>`).join('')}</ul>`);
      continue;
    }
    if (lines.every((l) => /^- /.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`);
      continue;
    }
    if (!open) { out.push(`<p class="dl-foot">${inline(b)}</p>`); continue; }
    out.push(`<p>${inline(lines.join(' '))}</p>`);
  }
  close();
  return { h1, lead, sections: out.join('\n') };
}
