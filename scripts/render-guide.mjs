import { readFile, writeFile } from "node:fs/promises";

const rootUrl = new URL("../", import.meta.url);
const configUrl = new URL("quiz.config.json", rootUrl);
const templateUrl = new URL("GUIDE.template.md", rootUrl);
const outputUrl = new URL("GUIDE.md", rootUrl);

const config = JSON.parse(await readFile(configUrl, "utf8"));
const template = await readFile(templateUrl, "utf8");

function readPath(path) {
  const value = path.split(".").reduce((current, key) => current?.[key], config);

  if (value === undefined) {
    throw new Error(`Unknown quiz config path: ${path}`);
  }

  return value;
}

function formatValue(value, format, path) {
  if (!format) {
    if (Array.isArray(value)) {
      throw new Error(`Config array ${path} requires an explicit format`);
    }
    return String(value);
  }

  if (!Array.isArray(value)) {
    throw new Error(`Format ${format} requires an array at ${path}`);
  }

  if (format === "slashes") {
    return value.join(" / ");
  }

  if (format === "words") {
    if (value.length === 1) return String(value[0]);
    if (value.length === 2) return `${value[0]} or ${value[1]}`;
    return `${value.slice(0, -1).join(", ")}, or ${value.at(-1)}`;
  }

  throw new Error(`Unknown guide value format: ${format}`);
}

const rendered = template.replace(
  /\{\{([a-zA-Z0-9.]+)(?:\|([a-zA-Z]+))?\}\}/g,
  (_, path, format) => formatValue(readPath(path), format, path),
);

if (/\{\{[^}]+\}\}/.test(rendered)) {
  throw new Error("Unresolved template token in GUIDE.template.md");
}

await writeFile(outputUrl, rendered);
console.log("Rendered GUIDE.md from quiz.config.json");
