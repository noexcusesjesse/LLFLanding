// LoadLine Program Disclaimer and Consent (/disclaimer).
// Copy lives verbatim in site-v5/content/disclaimer.md; this file only turns
// that markdown into the v5 page markup. Do not edit copy here.
// A paragraph of the form [COUNSEL: ...] renders as a visible
// "Pending attorney wording" callout so unreviewed sections can't be missed.
import { readFileSync } from 'node:fs';

export const DISCLAIMER_MD = readFileSync(new URL('./content/disclaimer.md', import.meta.url), 'utf8');

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

const COUNSEL_RE = /^\[COUNSEL:\s*([\s\S]*)\]$/;
export const counselBox = (note) => `<div class="pending" role="note" aria-label="Pending attorney wording">
<p class="pending-label"><svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>Pending attorney wording</p>
<p class="pending-note">[COUNSEL: ${inline(note)}]</p>
</div>`;

// Returns { h1, lead, sections } where sections is HTML for the body.
export function renderDisclaimer(md = DISCLAIMER_MD) {
  const blocks = md.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  let h1 = '';
  let lead = '';
  const out = [];
  let open = false; // inside a <section>
  const close = () => { if (open) { out.push('</section>'); open = false; } };
  for (const raw of blocks) {
    const b = raw.trim();
    if (b.startsWith('# ')) { h1 = inline(b.slice(2)); continue; }
    if (!h1 || (!lead && /^\*\*Effective date:\*\*/.test(b))) { lead = inline(b); continue; }
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
    const m = b.match(COUNSEL_RE);
    if (m) { out.push(counselBox(m[1])); continue; }
    if (!open) { out.push(`<p class="dl-foot">${inline(b)}</p>`); continue; }
    out.push(`<p>${inline(lines.join(' '))}</p>`);
  }
  close();
  return { h1, lead, sections: out.join('\n') };
}
