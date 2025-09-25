import { Hono } from "hono";
import { createAdaptor } from "@hono/express";
import app from "../server/index";

const hono = new Hono();
const expressHandler = createAdaptor(app);

// 所有請求都交給 Express 處理
hono.all("*", async (c) => {
  return expressHandler(c.req.raw, c.env);
});

export default hono;
