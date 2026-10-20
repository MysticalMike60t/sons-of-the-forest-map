import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../manifest.json" assert { type: "json" };

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

manifest.meta.name = manifest.meta.name.replace("-DEV", "");

await fs.writeFile(
  toAbsolute("../dist/manifest.json"),
  JSON.stringify(manifest)
);
await fs.cp(toAbsolute("../icons/"), toAbsolute("../dist/icons/"), {
  recursive: true,
});
