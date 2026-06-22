// CORE: entrypoint + server wiring. Express + React Router only.
import "dotenv/config";
import { createRequestHandler } from "@react-router/express";
import type { ServerBuild } from "react-router";
import express from "express";
import { createServer } from "node:http";
import fs from "node:fs";

const PORT = Number.parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0"; // Default to 0.0.0.0 for tunnel connectivity
const BUILD_PATH = "./build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV !== "production";

const isContainer = fs.existsSync("/.dockerenv") || fs.existsSync("/run/secrets/kubernetes.io");
const defaultPort = isContainer ? 443 : undefined;
const hmrClientPort = process.env.HMR_CLIENT_PORT
  ? Number(process.env.HMR_CLIENT_PORT)
  : defaultPort;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  if (DEVELOPMENT) {
    console.log("Starting development server with Vite");
    const vite = await import("vite");
    const viteDevServer = await vite.createServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
          ...(hmrClientPort ? { clientPort: hmrClientPort } : {}),
        },
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
    });
    app.use(viteDevServer.middlewares);
    app.all("*", async (req, res, next) => {
      try {
        return await createRequestHandler({
          build: (await viteDevServer.ssrLoadModule(
            "virtual:react-router/server-build"
          )) as unknown as ServerBuild,
          getLoadContext: () => ({}),
        })(req, res, next);
      } catch (error) {
        if (error instanceof Error) {
          viteDevServer.ssrFixStacktrace(error);
        }
        next(error);
      }
    });
  } else {
    console.log("Starting production server");
    app.use(express.static("build/client"));
    const build = await import(BUILD_PATH);
    app.all(
      "*",
      createRequestHandler({
        build: build as unknown as ServerBuild,
      })
    );
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });

  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
