import { readFile, writeFile } from "node:fs/promises";

const rootUrl = new URL("../", import.meta.url);
const bank = JSON.parse(await readFile(new URL("question-bank.json", rootUrl), "utf8"));
const config = JSON.parse(await readFile(new URL("quiz.config.json", rootUrl), "utf8"));

const formats = {
  wordle: { label: "Wordle", clues: 3 },
  ladders: { label: "Ladders", clues: 3 },
  stringTheory: { label: "String Theory", clues: 4 },
  forbidden: { label: "Forbidden", clues: 1 },
};

function fail(message) {
  throw new Error(`Deck validation failed: ${message}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wordleStates(guess, answer) {
  const guessed = [...guess.toLocaleUpperCase()];
  const target = [...answer.toLocaleUpperCase()];
  if (guessed.length !== target.length) {
    fail(`Wordle clue ${guess} has ${guessed.length} letters; ${answer} has ${target.length}`);
  }

  const states = Array(guessed.length).fill("absent");
  const remaining = new Map();
  guessed.forEach((letter, index) => {
    if (letter === target[index]) states[index] = "correct";
    else remaining.set(target[index], (remaining.get(target[index]) ?? 0) + 1);
  });
  guessed.forEach((letter, index) => {
    if (states[index] === "correct") return;
    if ((remaining.get(letter) ?? 0) > 0) {
      states[index] = "present";
      remaining.set(letter, remaining.get(letter) - 1);
    }
  });
  return states;
}

function validateWordleMatcher() {
  const actual = wordleStates("ALLEY", "APPLE");
  const expected = ["correct", "present", "absent", "present", "absent"];
  if (actual.some((state, index) => state !== expected[index])) {
    fail("Wordle matcher failed its repeated-letter self-check");
  }
}

function validate() {
  if (!Array.isArray(bank.questions) || bank.questions.length !== 25) {
    fail("question-bank.json must contain exactly 25 questions");
  }
  const byNumber = new Map();
  for (const question of bank.questions) {
    if (!Number.isInteger(question.number) || question.number < 1 || question.number > 25) {
      fail(`invalid question number ${question.number}`);
    }
    if (byNumber.has(question.number)) fail(`duplicate question ${question.number}`);
    byNumber.set(question.number, question);
    const spec = formats[question.format];
    if (!spec) fail(`question ${question.number} has unknown format ${question.format}`);
    if (!Array.isArray(question.clues) || question.clues.length !== spec.clues) {
      fail(`question ${question.number} (${spec.label}) must have ${spec.clues} clues`);
    }
    if (typeof question.answer !== "string" || !question.answer.trim()) {
      fail(`question ${question.number} has no canonical answer`);
    }
    if (question.acceptedAnswers !== undefined &&
        (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.some((a) => typeof a !== "string"))) {
      fail(`question ${question.number} has invalid acceptedAnswers`);
    }
    if (question.format === "wordle") {
      for (const clue of question.clues) wordleStates(clue, question.answer);
    }
  }
  for (let number = 1; number <= 25; number += 1) {
    if (!byNumber.has(number)) fail(`question ${number} is missing`);
  }

  const topicByQuestion = new Map();
  for (const [id, topic] of Object.entries(config.topics ?? {})) {
    if (typeof topic.name !== "string" || typeof topic.colorName !== "string" ||
        !topic.colorName.trim() || typeof topic.color !== "string" ||
        !/^#[0-9a-f]{6}$/i.test(topic.color) || !Array.isArray(topic.questionNumbers)) {
      fail(`topic ${id} must have a name, colorName, hex color, and questionNumbers`);
    }
    for (const number of topic.questionNumbers) {
      if (!byNumber.has(number)) fail(`topic ${id} references invalid question ${number}`);
      if (topicByQuestion.has(number)) fail(`question ${number} belongs to multiple topics`);
      topicByQuestion.set(number, { id, ...topic });
    }
  }
  if (topicByQuestion.size !== 25) fail("topic assignments must cover every question exactly once");

  for (const format of ["wordle", "ladders", "stringTheory"]) {
    const rewards = config.scoring?.[format]?.clueRewards;
    if (!Array.isArray(rewards) || rewards.length !== formats[format].clues ||
        rewards.some((reward) => !Number.isFinite(reward))) {
      fail(`scoring.${format}.clueRewards must contain ${formats[format].clues} numbers`);
    }
  }
  if (!Number.isFinite(config.scoring?.forbidden?.reward)) {
    fail("scoring.forbidden.reward must be a number");
  }
  return { byNumber, topicByQuestion };
}

const { byNumber, topicByQuestion } = validate();
validateWordleMatcher();

function button(href, label, className = "") {
  return `<a class="quiz-button ${className}" href="${href}">${label}</a>`;
}

function scoreboard() {
  return `<div class="score-strip" data-scoreboard><div class="score-player player-one"><i></i><span data-player-name="0">Player 1</span><strong data-player-score="0">0</strong></div><div class="score-player player-two"><i></i><span data-player-name="1">Player 2</span><strong data-player-score="1">0</strong></div></div>`;
}

function wordleTiles(clue, answer) {
  const states = wordleStates(clue, answer);
  return `<div class="wordle-row" role="img" aria-label="${escapeHtml(clue)}">${[...clue.toLocaleUpperCase()]
    .map((letter, index) => `<span class="wordle-tile ${states[index]}">${escapeHtml(letter)}</span>`)
    .join("")}</div>`;
}

function wordleGuessForm(question, stage) {
  const length = [...question.answer].length;
  return `<form class="wordle-guess-form" data-question="${question.number}" data-stage="${stage}" data-answer="${escapeHtml(question.answer.toLocaleUpperCase())}" data-length="${length}"><label><span class="visually-hidden">Guess for clue ${stage}</span><input class="wordle-guess-input" type="text" minlength="${length}" maxlength="${length}" pattern="[A-Za-z]{${length}}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${length}-letter guess" required></label><button type="submit">Submit guess</button><div class="wordle-guess-output" aria-live="polite"></div></form>`;
}

function rewardFor(question, stage) {
  if (question.format === "forbidden") return config.scoring.forbidden.reward;
  return config.scoring[question.format].clueRewards[stage - 1];
}

function slideHeader(question) {
  const format = formats[question.format];
  const topic = topicByQuestion.get(question.number);
  return `<div class="question-meta"><span class="topic-chip" style="--topic:${topic.color}">${escapeHtml(topic.colorName)}</span><span class="format-chip ${question.format}">${format.label}</span></div>`;
}

function renderClueSlide(question) {
  const clueCards = question.clues.map((clue, index) => {
    const stage = index + 1;
    const fragment = index === 0 ? "" : ` fragment" data-fragment-index="${index - 1}`;
    const content = question.format === "wordle"
      ? `${wordleTiles(clue, question.answer)}${wordleGuessForm(question, stage)}`
      : `<div class="clue-copy">${escapeHtml(clue)}</div>`;
    return `<div class="clue-card ${question.format}${fragment}" data-stage="${stage}" data-points="${rewardFor(question, stage)}"><div class="clue-label"><span>Clue ${stage}</span><strong>${rewardFor(question, stage)} points</strong></div>${content}</div>`;
  }).join("");
  return [
    `## Question ${question.number} {#q${question.number}-clues}`,
    "",
    scoreboard(),
    "",
    slideHeader(question),
    "",
    `<div class="clue-list ${question.format}" data-question="${question.number}">${clueCards}</div>`,
    "",
    `<nav class="quiz-nav">${button("#/board", "Board", "secondary")}<span class="advance-note">Advance to reveal the next clue</span>${button(`#/q${question.number}-answer`, "Reveal answer", "answer-button")}</nav>`,
  ].join("\n");
}

function renderAnswer(question) {
  const topic = topicByQuestion.get(question.number);
  const aliases = question.acceptedAnswers ?? [];
  const variants = aliases.length
    ? `<div class="accepted"><strong>Also accept:</strong> ${aliases.map(escapeHtml).join(" · ")}</div>`
    : `<div class="accepted muted">No additional accepted variants.</div>`;
  return [
    `## Question ${question.number} · Answer {#q${question.number}-answer}`,
    "",
    scoreboard(),
    "",
    `<div class="question-meta"><span class="topic-chip" style="--topic:${topic.color}">${escapeHtml(topic.colorName)}</span><span class="format-chip ${question.format}">${formats[question.format].label}</span></div>`,
    "",
    `<div class="answer-reveal"><span>Answer</span><strong>${escapeHtml(question.answer)}</strong></div>`,
    "",
    variants,
    "",
    `<nav class="quiz-nav">${button("#/board", "Board", "secondary")}<button class="quiz-button answer-button record-result" type="button" data-record-question="${question.number}">Record result</button></nav>`,
  ].join("\n");
}

function renderBoard() {
  const cells = Array.from({ length: 25 }, (_, index) => {
    const number = index + 1;
    const question = byNumber.get(number);
    const topic = topicByQuestion.get(number);
    const stageRewards = question.format === "forbidden"
      ? [config.scoring.forbidden.reward]
      : config.scoring[question.format].clueRewards;
    const pointOptions = question.format === "forbidden"
      ? stageRewards
      : [...new Set([...stageRewards, config.scoring.pass.reward])];
    return `<a class="board-cell ${question.format}" data-question="${number}" data-color-name="${escapeHtml(topic.colorName)}" data-format-label="${formats[question.format].label}" data-stage-points="${stageRewards.join(",")}" data-point-options="${pointOptions.join(",")}" href="#/q${number}-clues" style="--topic:${topic.color}" aria-label="Question ${number}: ${escapeHtml(topic.colorName)}, ${formats[question.format].label}"><span class="cell-number">${number}</span><span class="cell-topic">${escapeHtml(topic.colorName)}</span><span class="cell-format">${formats[question.format].label}</span><span class="cell-owner" aria-hidden="true"></span></a>`;
  }).join("");
  const legend = Object.values(config.topics).map((topic) => `<span style="--topic:${topic.color}"><i></i>${escapeHtml(topic.colorName)}</span>`).join("");
  const gameConfig = {
    bingoReward: config.scoring.bingo.reward,
    directionalRegions: Object.fromEntries(
      ["top", "left", "right", "bottom"].map((id) => [id, config.topics[id].questionNumbers]),
    ),
  };
  return [
    "## Choose a question {#board}",
    "",
    scoreboard(),
    "",
    `<div class="quiz-board">${cells}</div>`,
    "",
    `<div class="topic-legend">${legend}</div>`,
    "",
    `<button id="reset-game" class="reset-button" type="button">Reset Game</button>`,
    "",
    `<script id="quiz-game-config" type="application/json">${JSON.stringify(gameConfig)}</script>`,
  ].join("\n");
}

const slides = [renderBoard()];
for (let number = 1; number <= 25; number += 1) {
  const question = byNumber.get(number);
  slides.push(renderClueSlide(question));
  slides.push(renderAnswer(question));
}

await writeFile(new URL("quiz.generated.md", rootUrl), `${slides.join("\n\n---\n\n")}\n`);
console.log(`Generated ${slides.length} quiz slides from JSON sources`);
