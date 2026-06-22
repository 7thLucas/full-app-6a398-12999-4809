// CORE: reverse proxy. Serve the target site under our origin and strip
// framing/CSP response headers so the page renders without restriction.
import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

const PORT = Number.parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
const TARGET = process.env.PROXY_TARGET || "https://hospital.siloam.qtn.ai";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: true,
    on: {
      proxyRes: (proxyRes) => {
        // Drop headers that block embedding / restrict sources.
        delete proxyRes.headers["content-security-policy"];
        delete proxyRes.headers["content-security-policy-report-only"];
        delete proxyRes.headers["x-frame-options"];
      },
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
