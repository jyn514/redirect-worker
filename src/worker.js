/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// We want to return a response as soon as we've read the <head>, without waiting for the whole response.
// We use a global list of promises to communicate when <head> is ready.
// For reasons i don't understand, moving `done = []` to `async fetch` breaks things.
let done = [];

class MetaElementHandler {
  element(e) {
    let redirect, dst;
    for (let [name, value] of e.attributes) {
      if (name === "http-equiv" && value === "refresh") redirect = true;
      if (name === "content") dst = value.split(";url=")[1];
    }
    if (redirect && dst) done = [new Promise((resolve, _) => resolve(dst))];
  }
}

// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP(S) request
  // and should return a Response (optionally wrapped in a Promise)
  async fetch(req) {
    let origin = new Url(req.url);
    origin.host = 'localhost:1111';
    // origin.host = 'jyn.dev';
    // let res = await fetch("https://jyn.dev/");
    // console.log(origin);
    // let res = await fetch(origin);
    // let res = await fetch(req);
    let rewritten = new HTMLRewriter()
      .on("meta", new MetaElementHandler())
      .transform(res.clone());
    // Access the response body to force the HTMLRewriter to be evaluated.
    done.push(rewritten.text().then(_ => null));
    let dst = await Promise.any(done);
    if (dst !== null) {
      res = new Response("", { status: 302, headers: {
        Location: dst,
      }});
    }
    return res;
  }
};
