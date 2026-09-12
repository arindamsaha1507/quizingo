import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const rootUrl = new URL("../", import.meta.url);
const bank = JSON.parse(await readFile(new URL("question-bank.json", rootUrl), "utf8"));
const commonsApi = "https://commons.wikimedia.org/w/api.php";
const requestHeaders = { "User-Agent": "Forbidden Quizzingo deck image fetcher (local educational project)" };
const useOriginal = process.argv.includes("--original");
const useProxy = process.argv.includes("--proxy");
const selectedNumbers = new Set(process.argv.slice(2).map(Number).filter(Number.isFinite));

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, label) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { headers: requestHeaders });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${label} returned ${response.status}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const retryDelay = Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 2500;
    await pause(Math.min(retryDelay, 15000));
  }
  throw new Error(`${label} remained unavailable after five attempts`);
}

function commonsTitle(source) {
  const url = new URL(source);
  const marker = "/wiki/";
  const index = url.pathname.indexOf(marker);
  if (url.hostname !== "commons.wikimedia.org" || index < 0) {
    throw new Error(`Not a Wikimedia Commons file page: ${source}`);
  }
  return decodeURIComponent(url.pathname.slice(index + marker.length)).replaceAll("_", " ");
}

function commonsOriginalUrl(title) {
  const filename = title.replace(/^File:/i, "").replaceAll(" ", "_");
  const hash = createHash("md5").update(filename).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
}

async function download(question) {
  const title = commonsTitle(question.image.source);
  if (useOriginal || useProxy) {
    const originalUrl = commonsOriginalUrl(title);
    const remoteUrl = useProxy
      ? `https://images.weserv.nl/?${new URLSearchParams({ url: originalUrl, w: "1600", output: "jpg" })}`
      : originalUrl;
    const imageResponse = await fetchWithRetry(
      remoteUrl,
      `Original image download for Question ${question.number}`,
    );
    const destination = new URL(question.image.path, rootUrl);
    await mkdir(new URL("./", destination), { recursive: true });
    await writeFile(destination, Buffer.from(await imageResponse.arrayBuffer()));
    console.log(`Downloaded Question ${question.number}: ${question.image.path}`);
    await pause(600);
    return;
  }
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1600",
    titles: title,
    origin: "*",
  });
  const response = await fetchWithRetry(`${commonsApi}?${params}`, `Commons API for Question ${question.number}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No image information returned for ${title}`);

  const extension = question.image.path.split(".").pop().toLowerCase();
  const remoteUrl = extension === "svg" ? info.url : (info.thumburl ?? info.url);
  const imageResponse = await fetchWithRetry(remoteUrl, `Image download for Question ${question.number}`);
  const destination = new URL(question.image.path, rootUrl);
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, Buffer.from(await imageResponse.arrayBuffer()));
  console.log(`Downloaded Question ${question.number}: ${question.image.path}`);
  await pause(600);
}

for (const question of bank.questions) {
  if (selectedNumbers.size && !selectedNumbers.has(question.number)) continue;
  if (!question.image?.path || !question.image?.source) {
    throw new Error(`Question ${question.number} has incomplete image metadata`);
  }
  await download(question);
}
