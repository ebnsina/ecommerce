/**
 * The production server.
 *
 * adapter-node pre-compresses static assets at build time but serves rendered
 * HTML uncompressed, and that is the bulk of what a shopper downloads: the
 * shop's home page is around 640KB of markup and 27KB once compressed. Most
 * deployments hide this behind nginx or Caddy; this shop is meant to be run by
 * people who will not necessarily put one there, and on mobile data in
 * Bangladesh the difference is the page loading or not.
 *
 * So compression happens in-process. Anything in front of it — a proxy, a CDN —
 * sees an already-compressed response and leaves it alone.
 */
import compression from 'compression';
import { handler } from './build/handler.js';
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);
const compress = compression();

const server = createServer((req, res) => {
	compress(req, res, () => handler(req, res));
});

server.listen(port, () => {
	console.log(`listening on http://localhost:${port}`);
});
