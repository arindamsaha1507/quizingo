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
    if (typeof question.trivia !== "string" || !question.trivia.trim()) {
      fail(`question ${question.number} has no answer-slide trivia`);
    }
    const requiredImageFields = ["path", "alt", "caption", "credit", "source", "license"];
    if (!question.image || requiredImageFields.some((field) =>
      typeof question.image[field] !== "string" || !question.image[field].trim())) {
      fail(`question ${question.number} must provide complete answer-slide image metadata`);
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

  const conclusion = config.conclusion;
  if (!conclusion || !Array.isArray(conclusion.corners) || conclusion.corners.length !== 4 ||
      !Array.isArray(conclusion.regions) || conclusion.regions.length !== 5 ||
      !Array.isArray(conclusion.renaming?.pairs) || conclusion.renaming.pairs.length !== 2 ||
      !Array.isArray(conclusion.diplomatic?.roads) || conclusion.diplomatic.roads.length !== 4 ||
      typeof conclusion.partner?.name !== "string" ||
      !Array.isArray(conclusion.partner?.roles) || conclusion.partner.roles.length !== 2) {
    fail("conclusion must define the connection patterns and partner acknowledgement");
  }
  for (const corner of conclusion.corners) {
    if (!byNumber.has(corner.questionNumber) ||
        !["North", "East", "West", "South"].includes(corner.direction) ||
        typeof corner.road !== "string" || !corner.road.trim()) {
      fail("conclusion corners contain an invalid question, direction, or road");
    }
  }
  for (const region of conclusion.regions) {
    if (!config.topics[region.topicId] || typeof region.position !== "string" ||
        typeof region.connection !== "string" || !region.connection.trim()) {
      fail("conclusion regions contain an invalid topic or connection");
    }
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

function renderForbiddenAnswerGrid(question) {
  if (question.format !== "forbidden") return "";
  const cells = Array.from({ length: 25 }, (_, index) => {
    const number = index + 1;
    if (number === question.number) {
      return `<div class="forbidden-answer-item current"><span>${number}</span><strong>Forbidden</strong></div>`;
    }
    const otherQuestion = byNumber.get(number);
    const topic = topicByQuestion.get(number);
    const lengthClass = otherQuestion.answer.length > 45
      ? " very-long"
      : otherQuestion.answer.length > 24 ? " long" : "";
    return `<div class="forbidden-answer-item${lengthClass}" style="--topic:${topic.color}"><span>${number}</span><strong>${escapeHtml(otherQuestion.answer)}</strong></div>`;
  }).join("");
  return `<div class="forbidden-answer-heading">The other 24 correct answers</div><div class="forbidden-answer-grid" aria-label="Correct answers to Questions 1 to 12 and 14 to 25">${cells}</div>`;
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
    renderForbiddenAnswerGrid(question),
    "",
    `<nav class="quiz-nav">${button("#/board", "Board", "secondary")}<span class="advance-note">Advance to reveal the next clue</span>${button(`#/q${question.number}-answer`, "Reveal answer", "answer-button")}</nav>`,
  ].join("\n");
}

function renderAnswer(question) {
  const topic = topicByQuestion.get(question.number);
  const aliases = question.acceptedAnswers ?? [];
  const answerLengthClass = question.answer.length > 48
    ? " very-long-answer"
    : question.answer.length > 28 ? " long-answer" : "";
  const triviaLengthClass = question.trivia.includes("\n")
    ? " poem-trivia"
    : question.trivia.length > 300 ? " long-trivia" : "";
  const variants = aliases.length
    ? `<div class="accepted"><strong>Also accept:</strong> ${aliases.map(escapeHtml).join(" · ")}</div>`
    : `<div class="accepted muted">No additional accepted variants.</div>`;
  const image = question.image;
  const figure = `<figure class="answer-photo"><img src="${escapeHtml(image.path)}" alt="${escapeHtml(image.alt)}"><figcaption>${escapeHtml(image.caption)}</figcaption></figure>`;
  return [
    `## Question ${question.number} · Answer {#q${question.number}-answer}`,
    "",
    scoreboard(),
    "",
    `<div class="question-meta"><span class="topic-chip" style="--topic:${topic.color}">${escapeHtml(topic.colorName)}</span><span class="format-chip ${question.format}">${formats[question.format].label}</span></div>`,
    "",
    `<div class="answer-layout${triviaLengthClass}"><div class="answer-copy"><div class="answer-reveal${answerLengthClass}"><span>Answer</span><strong>${escapeHtml(question.answer)}</strong></div>${variants}<div class="answer-trivia"><span>Trivia</span><p>${escapeHtml(question.trivia).replaceAll("\n", "<br>")}</p></div></div>${figure}</div>`,
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

function connectionSlide(title, id, content, note = "") {
  return [
    `## ${title} {#${id}}`,
    "",
    `<div class="connection-slide">${content}${note ? `<p class="connection-note">${escapeHtml(note)}</p>` : ""}</div>`,
    "",
    `<nav class="quiz-nav connection-nav">${button("#/board", "Board", "secondary")}<span>Advance for the next connection</span></nav>`,
  ].join("\n");
}

function renderCornerConnection() {
  const cards = Object.fromEntries(config.conclusion.corners.map((corner) => {
    const question = byNumber.get(corner.questionNumber);
    return [corner.direction.toLowerCase(), `<div class="corner-card ${corner.direction.toLowerCase()}"><span>${escapeHtml(corner.direction)} · Question ${corner.questionNumber}</span><strong>${escapeHtml(question.answer)}</strong><i>→</i><b>${escapeHtml(corner.road)}</b></div>`];
  }));
  const content = `<div class="corner-compass">${cards.north}${cards.west}<div class="corner-centre"><strong>Lutyens’ Delhi</strong><span>Four corner answers become four boundary roads</span></div>${cards.east}${cards.south}</div>`;
  return connectionSlide("The four corners", "connection-corners", content, "Ashoka Road, Mathura Road, Mother Teresa Crescent and Lodhi Road mark the northern, eastern, western and southern edges of Lutyens’ Delhi.");
}

function renderRegionConnections() {
  const cards = config.conclusion.regions.map((region) => {
    const topic = config.topics[region.topicId];
    const answers = topic.questionNumbers.map((number) => escapeHtml(byNumber.get(number).answer)).join(" · ");
    return `<div class="region-card ${region.topicId}" style="--topic:${topic.color}"><span>${escapeHtml(region.position)} region · ${escapeHtml(topic.colorName)}</span><strong>${escapeHtml(region.connection)}</strong><p>${answers}</p></div>`;
  }).join("");
  return connectionSlide("The directional regions", "connection-regions", `<div class="region-connections">${cards}</div>`, "The position of each group on the board supplies a second layer of organisation.");
}

function renderRenamingConnection() {
  const pairs = config.conclusion.renaming.pairs.map((pair) => `<div class="rename-pair"><span>Formerly</span><strong>${escapeHtml(pair.old)}</strong><i>→</i><span>${pair.year}</span><b>${escapeHtml(pair.new)}</b></div>`).join("");
  return connectionSlide("An extra link in the top region", "connection-renaming", `<div class="rename-pairs">${pairs}</div><div class="rename-history"><strong>The name that moved</strong><p>${escapeHtml(config.conclusion.renaming.note)}</p></div>`);
}

function renderDiplomaticConnection() {
  const roads = config.conclusion.diplomatic.roads.map((road, index) => `<div class="diplomatic-road"><span>${index + 1}</span><strong>${escapeHtml(road)}</strong></div>`).join("");
  return connectionSlide("An extra link in the right region", "connection-diplomatic", `<div class="diplomatic-layout"><div><span class="connection-kicker">Chanakyapuri</span><h3>Delhi’s diplomatic enclave</h3><p>${escapeHtml(config.conclusion.diplomatic.note)}</p></div><div class="diplomatic-roads">${roads}</div></div>`, "The scripture answers therefore connect both by meaning and by geography.");
}

function renderPartnerSlide() {
  const partner = config.conclusion.partner;
  const roles = partner.roles.map((item) => `<div class="partner-role"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.role)}</span></div>`).join("");
  const content = `<div class="partner-story"><div class="partner-heading"><span>Partner in crime</span><strong>${escapeHtml(partner.name)}</strong></div><div class="partner-origin">${escapeHtml(partner.origin)}</div><div class="partner-journey"><div><span>Delhi: second home</span><strong>Anwaya + me</strong></div><i>created this quiz for</i><div><span>Delhi: first home</span><strong>Pratyaksha + Harshda</strong></div></div><p class="partner-creation">${escapeHtml(partner.creation)}</p><blockquote>${escapeHtml(partner.turn)}</blockquote><div class="partner-roles">${roles}</div></div>`;
  return connectionSlide("Partner in crime", "partner-in-crime", content, "Thank you for helping turn a wedding-day idea into this quiz.");
}

function renderWinnerSlide() {
  return [
    "## And the winner is… {#winner}",
    "",
    `<div class="winner-slide" data-winner-slide><div class="winner-emblem" aria-hidden="true">★</div><p class="winner-kicker">Forbidden Quizzingo</p><h3 data-winner-title>Complete all 25 questions to crown a winner</h3><p class="winner-message" data-winner-message>The final result will appear here.</p><div class="winner-scorecards"><div class="winner-scorecard player-one"><span data-winner-player="0">Player 1</span><strong data-winner-score="0">0</strong></div><div class="winner-versus">final score</div><div class="winner-scorecard player-two"><span data-winner-player="1">Player 2</span><strong data-winner-score="1">0</strong></div></div></div>`,
    "",
    `<nav class="quiz-nav winner-nav">${button("#/board", "Back to board", "secondary")}</nav>`,
  ].join("\n");
}

const slides = [renderBoard()];
for (let number = 1; number <= 25; number += 1) {
  const question = byNumber.get(number);
  slides.push(renderClueSlide(question));
  slides.push(renderAnswer(question));
}
slides.push(renderCornerConnection());
slides.push(renderRegionConnections());
slides.push(renderRenamingConnection());
slides.push(renderDiplomaticConnection());
slides.push(renderPartnerSlide());
slides.push(renderWinnerSlide());

await writeFile(new URL("quiz.generated.md", rootUrl), `${slides.join("\n\n---\n\n")}\n`);
console.log(`Generated ${slides.length} quiz slides from JSON sources`);
