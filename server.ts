// CORE: reverse proxy. Serve the target site under our origin and rewrite
// responses so all target-origin references become relative. This keeps every
// request (including XHR/fetch to /api/*) same-origin, avoiding CORS, and lets
// us strip framing/CSP headers so the page renders unrestricted.
import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";

const PORT = Number.parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
const TARGET = process.env.PROXY_TARGET || "https://hospital.siloam.qtn.ai";
const TARGET_HOST = new URL(TARGET).host;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: true,
    selfHandleResponse: true,
    // Rewrite cookies set for the target domain so they stick on our origin.
    cookieDomainRewrite: "",
    on: {
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, _req, res) => {
        // Drop headers that block embedding / restrict sources.
        res.removeHeader("content-security-policy");
        res.removeHeader("content-security-policy-report-only");
        res.removeHeader("x-frame-options");

        const contentType = String(proxyRes.headers["content-type"] || "");
        // Only rewrite text-based bodies that may carry absolute URLs.
        if (/text\/html|javascript|application\/json|text\/css/i.test(contentType)) {
          let body = responseBuffer.toString("utf8");
          // Absolute origin -> relative (so it routes back through this proxy).
          body = body.split(TARGET).join("");
          // Protocol-relative form (//host) -> relative.
          body = body.split(`//${TARGET_HOST}`).join("");
          return body;
        }

        return responseBuffer;
      }),
    },
  });

  app.use("/", proxy);

  // Upgrade WebSocket connections through the proxy too.
  httpServer.on("upgrade", proxy.upgrade);

  httpServer.listen(PORT, HOST, () => {
    console.log(`Reverse proxy for ${TARGET} running on http://${HOST}:${PORT}`);
  });

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
