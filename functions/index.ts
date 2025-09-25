import { createFetchHandler } from "@cloudflare/express";
import app from "../server/index";

// Cloudflare Pages Functions 需要的是 fetch handler
export default {
  fetch: createFetchHandler(app),
};
