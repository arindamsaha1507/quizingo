# Forbidden Quizzingo Game Guide

Forbidden Quizzingo is a two-team quiz played on a 5-by-5 grid. The board contains 25 questions arranged into topical regions and four question formats. Teams compete for question points, claim cells by answering correctly, and earn bonuses by completing Bingo patterns.

This guide explains the current game rules for players and quizmasters. The values in [`quiz.config.json`](quiz.config.json) are the source of truth for topic assignments and scoring. Running `node scripts/render-guide.mjs` synchronizes the config-driven parts of this document.

## At a Glance

- Two teams play, taking alternating turns.
- The quizmaster enters both team names before play begins.
- On a normal turn, the active team chooses any unopened question except Question 13.
- Opening a question commits the team to answering it.
- The active team may answer after every revealed clue without losing points for an incorrect attempt.
- A correct answer earns points and ownership of that cell.
- A missed question passes to the opposing team for <!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config --> points, with every remaining clue revealed first.
- If both teams miss a question, its cell becomes a permanent **Black Hole**.
- Completing a qualifying line or region earns a <!-- quiz-config:scoring.bingo.reward -->25<!-- /quiz-config -->-point Bingo bonus.
- Question 13 is the final **Forbidden** question and becomes available only after the other 24 questions have been attempted.

## The Board

Every numbered cell has both a **topic** and a **question format**. These are two different overlays on the same board.

### Topic Map

The topic names and cell assignments come from `quiz.config.json`.

<!-- quiz-config:start topic-map -->
**Legend:** <span style="color:#7c3aed">● Border</span> · <span style="color:#0f766e">● Renaming</span> · <span style="color:#b45309">● Structures</span> · <span style="color:#2563eb">● Scriptures</span> · <span style="color:#be185d">● Political Thinkers</span> · <span style="color:#16803c">● Numbers</span> · <span style="color:#dc2626">● Connector</span>

| | | | | |
|---|---|---|---|---|
| <span style="color:#7c3aed"><strong>1</strong></span> | <span style="color:#0f766e"><strong>2</strong></span> | <span style="color:#0f766e"><strong>3</strong></span> | <span style="color:#0f766e"><strong>4</strong></span> | <span style="color:#7c3aed"><strong>5</strong></span> |
| <span style="color:#b45309"><strong>6</strong></span> | <span style="color:#16803c"><strong>7</strong></span> | <span style="color:#0f766e"><strong>8</strong></span> | <span style="color:#16803c"><strong>9</strong></span> | <span style="color:#2563eb"><strong>10</strong></span> |
| <span style="color:#b45309"><strong>11</strong></span> | <span style="color:#b45309"><strong>12</strong></span> | <span style="color:#dc2626"><strong>13</strong></span> | <span style="color:#2563eb"><strong>14</strong></span> | <span style="color:#2563eb"><strong>15</strong></span> |
| <span style="color:#b45309"><strong>16</strong></span> | <span style="color:#16803c"><strong>17</strong></span> | <span style="color:#be185d"><strong>18</strong></span> | <span style="color:#16803c"><strong>19</strong></span> | <span style="color:#2563eb"><strong>20</strong></span> |
| <span style="color:#7c3aed"><strong>21</strong></span> | <span style="color:#be185d"><strong>22</strong></span> | <span style="color:#be185d"><strong>23</strong></span> | <span style="color:#be185d"><strong>24</strong></span> | <span style="color:#7c3aed"><strong>25</strong></span> |

The topics occupy recognizable parts of the grid:

| Region | Topic | Questions |
|---|---|---|
| Corners | Border | 1, 5, 21, 25 |
| Top | Renaming | 2, 3, 4, 8 |
| Left | Structures | 6, 11, 12, 16 |
| Right | Scriptures | 10, 14, 15, 20 |
| Bottom | Political Thinkers | 18, 22, 23, 24 |
| Inner diagonals | Numbers | 7, 9, 17, 19 |
| Centre | Connector | 13 |
<!-- quiz-config:end topic-map -->

### Format Map

**Legend:** <span style="color:#16803c">● Wordle</span> · <span style="color:#2563eb">● String Theory</span> · <span style="color:#c56a00">● Ladders</span> · <span style="color:#dc2626">● Forbidden</span>

| | | | | |
|---|---|---|---|---|
| <span style="color:#16803c"><strong>1</strong></span> | <span style="color:#c56a00"><strong>2</strong></span> | <span style="color:#c56a00"><strong>3</strong></span> | <span style="color:#c56a00"><strong>4</strong></span> | <span style="color:#16803c"><strong>5</strong></span> |
| <span style="color:#c56a00"><strong>6</strong></span> | <span style="color:#2563eb"><strong>7</strong></span> | <span style="color:#c56a00"><strong>8</strong></span> | <span style="color:#2563eb"><strong>9</strong></span> | <span style="color:#c56a00"><strong>10</strong></span> |
| <span style="color:#c56a00"><strong>11</strong></span> | <span style="color:#c56a00"><strong>12</strong></span> | <span style="color:#dc2626"><strong>13</strong></span> | <span style="color:#c56a00"><strong>14</strong></span> | <span style="color:#c56a00"><strong>15</strong></span> |
| <span style="color:#c56a00"><strong>16</strong></span> | <span style="color:#2563eb"><strong>17</strong></span> | <span style="color:#c56a00"><strong>18</strong></span> | <span style="color:#2563eb"><strong>19</strong></span> | <span style="color:#c56a00"><strong>20</strong></span> |
| <span style="color:#16803c"><strong>21</strong></span> | <span style="color:#c56a00"><strong>22</strong></span> | <span style="color:#c56a00"><strong>23</strong></span> | <span style="color:#c56a00"><strong>24</strong></span> | <span style="color:#16803c"><strong>25</strong></span> |

## Question Formats

In every format, the active team may submit an answer after each clue is revealed. An incorrect attempt does not deduct points. If the team asks for another clue, however, the maximum available reward changes to the next configured clue-stage value.

As soon as the active team answers correctly, the quizmaster reveals all remaining clues, if any, before completing the question.

### Wordle

Used for Questions **1, 5, 21, and 25**.

- The answer is one word.
- There are three one-word clues, revealed one at a time.
- Every clue has the same number of letters as the answer.
- After each clue, the active team may submit one guess of the required length.
- Clues and submitted guesses receive standard Wordle colouring, including exact repeated-letter handling.
- Solving after the first, second, or third clue earns **<!-- quiz-config:scoring.wordle.clueRewards:words -->15, 10, or 5<!-- /quiz-config --> points**, respectively.

### Ladders

Used for every normal question that is not Wordle or String Theory.

- Three clues lead to one answer.
- Clues become progressively easier.
- The first revealed clue makes **<!-- quiz-config:scoring.ladders.clueRewards.0 -->15<!-- /quiz-config --> points** available.
- Revealing the second clue reduces the available score to **<!-- quiz-config:scoring.ladders.clueRewards.1 -->10<!-- /quiz-config --> points**.
- Revealing the third clue reduces it to **<!-- quiz-config:scoring.ladders.clueRewards.2 -->5<!-- /quiz-config --> points**.

### String Theory

Used for Questions **7, 9, 17, and 19**.

- Four clues share a common connection.
- Clues are revealed one at a time.
- The active team may identify the connection after each reveal.
- Solving after the first, second, third, or fourth clue earns **<!-- quiz-config:scoring.stringTheory.clueRewards:words -->20, 15, 10, or 5<!-- /quiz-config --> points**, respectively.
- The connection can be any shared theme; it does not have to be a literal scientific theory.

### Forbidden

Used only for Question **<!-- quiz-config:topics.centre.questionNumbers.0 -->13<!-- /quiz-config -->**, whose topic is **<!-- quiz-config:topics.centre.name -->Connector<!-- /quiz-config -->**.

- Question 13 stays locked until all other 24 questions have been opened and answered.
- It asks for the common theme connecting the answers to those 24 questions.
- Both teams may answer simultaneously; it is not part of the normal turn order.
- Only the first team to answer correctly earns **<!-- quiz-config:scoring.forbidden.reward -->25<!-- /quiz-config --> points** and claims the centre cell.
- If neither team answers correctly, neither team claims the cell.

## How a Normal Turn Works

1. The active team selects any unopened non-Forbidden cell.
2. The quizmaster opens the question and reveals its first clue.
3. The active team submits an answer. Once opened, the question cannot be abandoned without an answer.
4. If the answer is incorrect, no points are deducted and the correct answer remains hidden. The team may reveal the next clue and answer again at that clue's available value.
5. If the active team answers correctly, the quizmaster immediately reveals every remaining clue, reveals the correct answer, and awards the points available when the answer was given. A custom-points override is available for exceptional cases.
6. If the active team does not answer correctly, the quizmaster reveals every remaining clue and passes the question to the opposing team for a flat **<!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config --> points**.
7. After the pass attempt, the quizmaster reveals the correct answer, completes the question, and continues the normal alternating turn order.

A non-Forbidden question counts as attempted only after it has been opened and an answer has been submitted. This includes questions that end as Black Holes.

### Passing and Turn Order

A pass gives the opposing team a chance to answer the same question. Before the pass attempt, the quizmaster reveals all clues that the active team had not yet seen. The pass does not insert or remove a regular turn: the next normal turn still belongs to whichever team was already due to play next.

For example, Team A opens a question on its turn and answers incorrectly. The question passes to Team B for <!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config --> points. After the question is resolved, Team B still takes the next regular turn.

### Claiming Cells

- If the active team answers correctly, it claims the cell.
- If the opposing team answers correctly on a pass, it claims the cell.
- If neither team answers correctly, the cell becomes a permanent **Black Hole** that belongs to neither team.
- A Black Hole is a separate blocked state, not an unopened, open, or team-owned cell.
- Points and cell ownership normally go to the same successful team.

## Scoring

The quiz automatically totals question awards and Bingo bonuses entered or triggered during play.

| Event | Points |
|---|---:|
| Wordle, after clues 1 / 2 / 3 | <!-- quiz-config:scoring.wordle.clueRewards:slashes -->15 / 10 / 5<!-- /quiz-config --> |
| Ladders, after clues 1 / 2 / 3 | <!-- quiz-config:scoring.ladders.clueRewards:slashes -->15 / 10 / 5<!-- /quiz-config --> |
| String Theory, after clues 1 / 2 / 3 / 4 | <!-- quiz-config:scoring.stringTheory.clueRewards:slashes -->20 / 15 / 10 / 5<!-- /quiz-config --> |
| Correct pass answer | <!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config --> |
| Forbidden | <!-- quiz-config:scoring.forbidden.reward -->25<!-- /quiz-config --> |
| Each distinct Bingo | <!-- quiz-config:scoring.bingo.reward -->25<!-- /quiz-config --> |

By default, the quizmaster may award only the value available at the current reveal stage. The custom-points override should be used only when an exceptional ruling requires a different award.

## Bingo

Teams earn Bingo bonuses by claiming complete patterns on the 5-by-5 grid. A Bingo adds **<!-- quiz-config:scoring.bingo.reward -->25<!-- /quiz-config --> points** and does not end the game.

### Qualifying Patterns

- Any of the five complete horizontal rows
- Any of the five complete vertical columns
- Either full corner-to-corner diagonal: **1–7–13–19–25** or **5–9–13–17–21**
- The Top region: **<!-- quiz-config:topics.top.questionNumbers:ands -->2, 3, 4, and 8<!-- /quiz-config -->**
- The Left region: **<!-- quiz-config:topics.left.questionNumbers:ands -->6, 11, 12, and 16<!-- /quiz-config -->**
- The Right region: **<!-- quiz-config:topics.right.questionNumbers:ands -->10, 14, 15, and 20<!-- /quiz-config -->**
- The Bottom region: **<!-- quiz-config:topics.bottom.questionNumbers:ands -->18, 22, 23, and 24<!-- /quiz-config -->**

Only the two full corner-to-corner diagonals count as diagonal Bingo patterns. The four corners by themselves and the four inner-diagonal cells by themselves are not Bingo patterns.

A Black Hole cannot contribute to any Bingo pattern for either team. Any row, column, diagonal, or directional region that contains a Black Hole is permanently impossible for both teams.

### Bingo Awards

- Each distinct pattern can be awarded once per team.
- A team may earn several different Bingo bonuses during the game.
- A previously awarded pattern cannot score again after later actions or score edits.
- Both full diagonals include Question 13, so only the team that wins Forbidden can complete either diagonal.

Example: claiming Questions 1–5 completes the first row and earns one Bingo. Later claiming Questions 6–10 completes a different row and earns another Bingo.

## Quizmaster Checklist

### Before the Game

- Enter both team names.
- Confirm which team takes the first turn.
- Keep Question 13 locked.
- Briefly explain the four formats, passing, cell ownership, and Bingo bonuses.

### During Each Normal Question

- Confirm the active team before opening a cell.
- Reveal only the number of clues requested or permitted by the format.
- Allow the active team to answer after every clue without deducting points for an incorrect attempt.
- After a correct answer from the active team, reveal all remaining clues before completing the question.
- For Wordle, enforce the answer length and apply standard letter colouring.
- Record the submitted answer before revealing the correct answer.
- Award the available score or deliberately use the custom override.
- If the active team does not answer correctly, reveal all remaining clues and offer the opposing team the <!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config -->-point pass.
- Assign the cell to the team that answered correctly, or mark it as a Black Hole if neither team solves it.
- Check for newly completed, previously unawarded Bingo patterns.

### At the End

- Unlock Question 13 only after all other 24 questions have been attempted.
- Open Forbidden to both teams simultaneously.
- Award its points and cell only to the first team to answer correctly.
- Apply any final Bingo created by ownership of the centre cell.
- Confirm the final automated totals.

## Quick Example

Team A chooses Question 7, a String Theory question. The quizmaster reveals two clues, and Team A submits the correct connection. Team A receives **<!-- quiz-config:scoring.stringTheory.clueRewards.1 -->15<!-- /quiz-config --> points** and claims cell 7.

If Team A had answered incorrectly, Team B could have attempted the same question for **<!-- quiz-config:scoring.pass.reward -->5<!-- /quiz-config --> points**. A correct pass would give Team B the points and cell 7. Team B would still take the next regular turn because the pass does not alter the alternating turn order.
