import express from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  await registerRoutes(app);

  if (app.get("env") !== "development") {
    serveStatic(app); // 生產環境提供靜態檔案
  }

  log("Express app initialized");
})();

// 匯出 Express app，Cloudflare 會用到
export default app;
