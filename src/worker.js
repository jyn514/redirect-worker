/**
 * - `wrangler dev` to start a server at http://localhost:8787
 * - `npm run deploy` to publish
 * - docs: https://developers.cloudflare.com/workers/
 */

// the `document.createElement` solution from stackoverflow doesn't work in edgeworker; there's no DOM
import {decode} from 'html-entities';

class MetaElementHandler {
  constructor() {
    this.redirect = null;
  }
  element(e) {
    if (e.getAttribute('http-equiv')?.toLowerCase() !== 'refresh') {
      return;
    }
    let value = e.getAttribute('content');
    const match = value.match(/^\s*\d+\s*;\s*url\s*=\s*"?(.+)"?\s*$/i);
    if (match && match[1]) this.redirect = decode(match[1].trim());
  }
}

// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP(S) request
  // and should return a Response (optionally wrapped in a Promise)
  async fetch(req) {
    let origin = new URL(req.url);
    // origin.host = 'localhost:1111';
    origin.host = 'jyn.dev:443';
    origin.protocol = 'https:';
    let transformer = new MetaElementHandler();
    let res = await fetch(origin);
    let rewritten = new HTMLRewriter()
      .on("meta", transformer)
      .transform(res.clone());
    // Access the response body to force the HTMLRewriter to be evaluated.
    // TODO: find a way to abort early when we finish parsing <head>
    await rewritten.text();
    if (transformer.redirect !== null) {
      return new Response("", { status: 302, headers: {
        Location: transformer.redirect,
      }});
    }
    return res;
  }
};
