// Reverse proxy for the LoadLine client file portal, served at
// https://www.loadlinefitness.com/clients (the portal is a separate Railway
// app built with basePath "/clients").
//
// Mounted BEFORE cors()/express.json() so request bodies stream through
// untouched and no wildcard CORS headers are added. Uploads go straight to the
// private bucket with presigned URLs, so large files never pass through here.
//
// The portal only answers requests that carry the shared PORTAL_PROXY_SECRET
// header, and trusts x-llf-client-ip (used for login rate limits and the audit
// log) only on those requests.
import http from 'node:http';
import https from 'node:https';

export const PORTAL_PREFIX = '/clients';

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'proxy-connection',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);
// Never accepted from the browser: these are set by the proxy only.
const PRIVATE_REQUEST_HEADERS = /^x-llf-/i;

export const isPortalPath = (path) => path === PORTAL_PREFIX || path.startsWith(PORTAL_PREFIX + '/');

export function clientIpOf(req) {
  const real = String(req.headers['x-real-ip'] || '').trim();
  if (real) return real;
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket?.remoteAddress || '';
}

function connectionTokens(headers) {
  return new Set(String(headers.connection || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean));
}

export function clientPortalProxy({
  upstream = process.env.PORTAL_UPSTREAM,
  secret = process.env.PORTAL_PROXY_SECRET,
  canonicalHost = () => process.env.CANONICAL_HOST,
  timeoutMs = 120_000,
} = {}) {
  if (!upstream || !secret) {
    return (req, res, next) => next(); // not configured: /clients falls through to the normal 404
  }
  const target = new URL(upstream);
  const isHttps = target.protocol === 'https:';
  const agent = new (isHttps ? https : http).Agent({ keepAlive: true, maxSockets: 64 });
  const upstreamOrigin = target.origin;

  return function portalProxy(req, res, next) {
    const path = req.path || req.url.split('?')[0];
    if (!isPortalPath(path)) return next();

    const canonical = canonicalHost();
    if (canonical) {
      const proto = req.get('x-forwarded-proto') || req.protocol;
      if (req.hostname !== canonical || proto !== 'https') {
        return res.redirect(301, `https://${canonical}${req.originalUrl}`);
      }
    }
    const publicOrigin = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;

    const drop = connectionTokens(req.headers);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (HOP_BY_HOP.has(key) || drop.has(key) || key === 'host' || PRIVATE_REQUEST_HEADERS.test(key)) continue;
      headers[key] = v;
    }
    headers.host = target.host;
    headers['x-forwarded-host'] = req.get('host') || '';
    headers['x-forwarded-proto'] = req.get('x-forwarded-proto') || req.protocol;
    headers['x-llf-proxy-secret'] = secret;
    headers['x-llf-client-ip'] = clientIpOf(req);
    if (req.headers['transfer-encoding']) headers['transfer-encoding'] = req.headers['transfer-encoding'];

    const upstreamReq = (isHttps ? https : http).request({
      protocol: target.protocol, hostname: target.hostname, port: target.port || (isHttps ? 443 : 80),
      method: req.method, path: req.originalUrl, headers, agent, servername: target.hostname,
    }, (up) => {
      const respDrop = connectionTokens(up.headers);
      const out = {};
      for (const [k, v] of Object.entries(up.headers)) {
        if (HOP_BY_HOP.has(k) || respDrop.has(k)) continue;
        out[k] = v; // set-cookie arrives as an array and is passed through as-is
      }
      if (typeof out.location === 'string' && out.location.startsWith(upstreamOrigin)) {
        out.location = publicOrigin + out.location.slice(upstreamOrigin.length);
      }
      res.writeHead(up.statusCode || 502, up.statusMessage, out);
      up.pipe(res);
      up.on('error', () => res.destroy());
    });
    upstreamReq.setTimeout(timeoutMs, () => upstreamReq.destroy(new Error('upstream timeout')));
    upstreamReq.on('error', (err) => {
      console.error('[clients-proxy] upstream error:', err.code || err.message);
      if (!res.headersSent) {
        res.status(502).set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex, nofollow')
          .type('text/plain').send('The client portal is temporarily unavailable. Please try again in a minute.');
      } else res.destroy();
    });
    req.on('aborted', () => upstreamReq.destroy());
    req.pipe(upstreamReq);
  };
}
