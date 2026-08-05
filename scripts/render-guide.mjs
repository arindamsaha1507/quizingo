import { readFile, writeFile } from "node:fs/promises";

const rootUrl = new URL("../", import.meta.url);
const configUrl = new URL("quiz.config.json", rootUrl);
const guideUrl = new URL("GUIDE.md", rootUrl);

const config = JSON.parse(await readFile(configUrl, "utf8"));
const guide = await readFile(guideUrl, "utf8");

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

  if (format === "ands") {
    if (value.length === 1) return String(value[0]);
    if (value.length === 2) return `${value[0]} and ${value[1]}`;
    return `${value.slice(0, -1).join(", ")}, and ${value.at(-1)}`;
  }

  throw new Error(`Unknown guide value format: ${format}`);
}

const topicPresentation = {
  corners: { color: "#7c3aed", region: "Corners" },
  top: { color: "#0f766e", region: "Top" },
  left: { color: "#b45309", region: "Left" },
  right: { color: "#2563eb", region: "Right" },
  bottom: { color: "#be185d", region: "Bottom" },
  diagonals: { color: "#16803c", region: "Inner diagonals" },
  centre: { color: "#dc2626", region: "Centre" },
};

function renderTopicMap() {
  const topicEntries = Object.entries(topicPresentation).map(([id, presentation]) => {
    const topic = config.topics?.[id];

    if (!topic || typeof topic.name !== "string" || !Array.isArray(topic.questionNumbers)) {
      throw new Error(`Invalid or missing topic config: topics.${id}`);
    }

    return { ...presentation, ...topic };
  });

  const topicsByQuestion = new Map();
  for (const topic of topicEntries) {
    for (const questionNumber of topic.questionNumbers) {
      if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 25) {
        throw new Error(`Invalid question number ${questionNumber} in topic ${topic.name}`);
      }
      if (topicsByQuestion.has(questionNumber)) {
        throw new Error(`Question ${questionNumber} belongs to more than one topic`);
      }
      topicsByQuestion.set(questionNumber, topic);
    }
  }

  if (topicsByQuestion.size !== 25) {
    const missing = Array.from({ length: 25 }, (_, index) => index + 1).filter(
      (questionNumber) => !topicsByQuestion.has(questionNumber),
    );
    throw new Error(`Topic assignments must cover all 25 questions; missing: ${missing.join(", ")}`);
  }

  const legend = topicEntries
    .map(
      ({ color, name }) => `<span style="color:${color}">● ${name}</span>`,
    )
    .join(" · ");

  const rows = Array.from({ length: 5 }, (_, rowIndex) => {
    const cells = Array.from({ length: 5 }, (_, columnIndex) => {
      const questionNumber = rowIndex * 5 + columnIndex + 1;
      const topic = topicsByQuestion.get(questionNumber);
      return `<span style="color:${topic.color}"><strong>${questionNumber}</strong></span>`;
    });
    return `| ${cells.join(" | ")} |`;
  });

  const regionRows = topicEntries.map(
    ({ region, name, questionNumbers }) =>
      `| ${region} | ${name} | ${questionNumbers.join(", ")} |`,
  );

  return [
    `**Legend:** ${legend}`,
    "",
    "| | | | | |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    "The topics occupy recognizable parts of the grid:",
    "",
    "| Region | Topic | Questions |",
    "|---|---|---|",
    ...regionRows,
  ].join("\n");
}

function replaceGeneratedBlock(contents, name, replacement) {
  const start = `<!-- quiz-config:start ${name} -->`;
  const end = `<!-- quiz-config:end ${name} -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, "g");
  const matches = contents.match(pattern) ?? [];

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one generated block named ${name}`);
  }

  return contents.replace(pattern, `${start}\n${replacement}\n${end}`);
}

let rendered = replaceGeneratedBlock(guide, "topic-map", renderTopicMap());

rendered = rendered.replace(
  /<!-- quiz-config:([a-zA-Z0-9.]+)(?::([a-zA-Z]+))? -->([\s\S]*?)<!-- \/quiz-config -->/g,
  (_, path, format) => {
    const token = `${path}${format ? `:${format}` : ""}`;
    return `<!-- quiz-config:${token} -->${formatValue(readPath(path), format, path)}<!-- /quiz-config -->`;
  },
);

if (/\{\{[^}]+\}\}/.test(rendered)) {
  throw new Error("Obsolete template token found in GUIDE.md");
}

await writeFile(guideUrl, rendered);
console.log("Synchronized GUIDE.md with quiz.config.json");
