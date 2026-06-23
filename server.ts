// CORE: reverse proxy. Serve the target site under our origin.
//
// Everything is streamed straight through (so assets/binaries are untouched)
// EXCEPT HTML documents, which are buffered just long enough to:
//   - strip CSP / X-Frame-Options so the page renders unrestricted, and
//   - inject a tiny bootstrap script that rewrites absolute target-origin URLs
//     to relative ones at runtime (fetch / XHR / WebSocket).
//
// The app bundle hardcodes baseUrl:"https://hospital.siloam.qtn.ai", so its API
// calls would otherwise go cross-origin (browser -> target directly), bypassing
// this proxy and failing CORS. The runtime patch forces those requests back
// through this origin without touching any JS asset.
import "dotenv/config";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";

const PORT = Number.parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
const TARGET = process.env.PROXY_TARGET || "https://hospital.siloam.qtn.ai";
const TARGET_URL = new URL(TARGET);
const TARGET_HOST = TARGET_URL.host; // e.g. hospital.siloam.qtn.ai
const TARGET_PORT = TARGET_URL.port ? Number(TARGET_URL.port) : 443;

// Runtime patch injected into HTML <head>. Rewrites any absolute reference to
// the target origin (http/ws) into a same-origin relative URL so it routes
// back through this proxy.
const INJECT = `<script>(function(){
  var H=${JSON.stringify(TARGET_HOST)};
  function rel(u){try{if(typeof u!=="string")return u;
    var p=["https://"+H,"http://"+H,"//"+H];
    for(var i=0;i<p.length;i++){if(u.indexOf(p[i])===0)return u.slice(p[i].length)||"/";}
  }catch(e){}return u;}
  var of=window.fetch;
  if(of)window.fetch=function(i,init){try{if(i&&typeof i==="object"&&i.url){i=new Request(rel(i.url),i);}else{i=rel(i);}}catch(e){}return of.call(this,i,init);};
  var oo=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(){try{arguments[1]=rel(arguments[1]);}catch(e){}return oo.apply(this,arguments);};
  var OW=window.WebSocket;
  if(OW){var NW=function(u,p){try{if(typeof u==="string"){var s=(location.protocol==="https:"?"wss://":"ws://")+location.host;u=u.split("wss://"+H).join(s).split("ws://"+H).join(s).split("//"+H).join(s);}}catch(e){}return p===undefined?new OW(u):new OW(u,p);};NW.prototype=OW.prototype;NW.CONNECTING=OW.CONNECTING;NW.OPEN=OW.OPEN;NW.CLOSING=OW.CLOSING;NW.CLOSED=OW.CLOSED;window.WebSocket=NW;}
})();</script>`;

function rewriteSetCookie(value: string | string[] | undefined) {
  if (!value) return value;
  const strip = (c: string) => c.replace(/;\s*Domain=[^;]+/i, "");
  return Array.isArray(value) ? value.map(strip) : strip(value);
}

const server = http.createServer((req, res) => {
  const headers = { ...req.headers } as Record<string, string | string[] | undefined>;
  const clientHost = req.headers.host;
  headers.host = TARGET_HOST;
  // Rewrite Origin/Referer to the target origin. The target's CSRF/origin
  // checks compare these against its own host; left as our proxy origin they
  // mismatch and state-changing requests (e.g. login) get a 403, so cookies
  // are never set and auth silently fails.
  if (headers.origin) headers.origin = TARGET_URL.origin;
  if (typeof headers.referer === "string" && clientHost) {
    headers.referer = headers.referer.replace(`//${clientHost}`, `//${TARGET_HOST}`);
  }
  // Force uncompressed, full responses: simplifies HTML injection and avoids
  // 304s with empty bodies.
  delete headers["accept-encoding"];
  delete headers["if-none-match"];
  delete headers["if-modified-since"];

  const upstream = https.request(
    {
      host: TARGET_URL.hostname,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers,
      servername: TARGET_URL.hostname,
    },
    (proxyRes) => {
      const outHeaders = { ...proxyRes.headers };
      delete outHeaders["content-security-policy"];
      delete outHeaders["content-security-policy-report-only"];
      delete outHeaders["x-frame-options"];
      // Rewrite redirects that point back at the target origin to relative
      // paths, so the browser stays on the proxy origin. Otherwise a
      // post-login 302 to https://<target>/... sends the browser straight to
      // the target, where the (host-only) auth cookie doesn't exist, and it
      // immediately bounces back to login — looks like an instant logout.
      if (typeof outHeaders.location === "string") {
        outHeaders.location = outHeaders.location.replace(
          new RegExp(`^https?://${TARGET_HOST.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
          ""
        );
      }
      if (outHeaders["set-cookie"]) {
        outHeaders["set-cookie"] = rewriteSetCookie(outHeaders["set-cookie"]) as string[];
      }

      const contentType = String(proxyRes.headers["content-type"] || "");
      const isHtml = /text\/html/i.test(contentType);

      if (!isHtml) {
        // Stream binaries/JS/CSS/JSON untouched.
        // Drop upstream framing headers: the Node http client has already
        // de-chunked the body, so `proxyRes` is the decoded entity. Letting
        // Node re-frame the outgoing response avoids forwarding a stale
        // Content-Length and prevents emitting both Content-Length and
        // Transfer-Encoding at once (which makes nginx return 502).
        delete outHeaders["content-length"];
        delete outHeaders["transfer-encoding"];
        delete outHeaders["connection"];
        res.writeHead(proxyRes.statusCode || 502, outHeaders);
        proxyRes.pipe(res);
        return;
      }

      // Buffer HTML, inject the bootstrap script, then send.
      const chunks: Buffer[] = [];
      proxyRes.on("data", (c) => chunks.push(c as Buffer));
      proxyRes.on("end", () => {
        let body = Buffer.concat(chunks).toString("utf8");
        if (body.includes("<head>")) {
          body = body.replace("<head>", `<head>${INJECT}`);
        } else if (body.includes("<html")) {
          body = body.replace(/(<html[^>]*>)/i, `$1${INJECT}`);
        } else {
          body = INJECT + body;
        }
        const buf = Buffer.from(body, "utf8");
        delete outHeaders["content-length"];
        delete outHeaders["content-encoding"];
        delete outHeaders["transfer-encoding"];
        res.writeHead(proxyRes.statusCode || 200, { ...outHeaders, "content-length": buf.length });
        res.end(buf);
      });
    }
  );

  upstream.on("error", (err) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(upstream);
});

// Proxy WebSocket upgrades through a TLS tunnel to the target.
server.on("upgrade", (req, clientSocket, head) => {
  const upstream = tls.connect(
    { host: TARGET_URL.hostname, port: TARGET_PORT, servername: TARGET_URL.hostname },
    () => {
      const lines = [`${req.method} ${req.url} HTTP/1.1`];
      const h = { ...req.headers, host: TARGET_HOST } as Record<string, string | string[]>;
      // Match the HTTP path: present the target's own origin so any
      // origin/CSRF check on the WS handshake passes.
      if (h.origin) h.origin = TARGET_URL.origin;
      if (typeof h.referer === "string") {
        h.referer = (h.referer as string).replace(`//${req.headers.host}`, `//${TARGET_HOST}`);
      }
      for (const [k, v] of Object.entries(h)) {
        if (Array.isArray(v)) v.forEach((vv) => lines.push(`${k}: ${vv}`));
        else lines.push(`${k}: ${v}`);
      }
      upstream.write(lines.join("\r\n") + "\r\n\r\n");
      if (head && head.length) upstream.write(head);
      upstream.pipe(clientSocket);
      clientSocket.pipe(upstream);
    }
  );
  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
});

server.listen(PORT, HOST, () => {
  console.log(`Reverse proxy for ${TARGET} running on http://${HOST}:${PORT}`);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
