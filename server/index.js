import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
const args = process.argv.slice(2);
const option = (key) => {
  const index = args.indexOf(key);
  return index >= 0 ? args[index + 1] : undefined;
};
const port = Number(option("--port") || process.env.PORT || 3000);
const host = option("--host") || process.env.HOST || "127.0.0.1";
createApp(fileURLToPath(new URL("../dist", import.meta.url))).listen(
  port,
  host,
  () => {
    console.log(`Gen-Yu Academy: http://${host}:${port}`);
  },
);
