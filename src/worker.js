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
    console.log(e);
    console.log(e.attributes);
    for (let [name, value] of e.attributes) {
      console.log(name, value)
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
    const res = await fetch("https://jyn.dev/talks/bootstrapping/");
    // const res = await fetch("https://jyn.dev");
    let rewritten = new HTMLRewriter()
      .on("meta", new MetaElementHandler())
      .transform(res.clone());
    console.log('rewrite')
    // Access the response body to force the HTMLRewriter to be evaluated.
    done.push(rewritten.text().then(_ => null));
    // let dst = await Promise.any(done);
    if (dst !== null) {
      return Response.redirect(dst);
    } else {
      return res;
    }
  }
};
