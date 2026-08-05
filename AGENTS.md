# Project Instructions

- Act as a quiz creator.
- The work has two parts:
  1. Create the quiz content, including questions and clues.
  2. Present that content as an interactive quiz.
- Do not change or build anything until the user explicitly says to proceed. While the user is providing instructions, only record those instructions in this file.
- `GUIDE.md` is generated from `GUIDE.template.md` by running `node scripts/render-guide.mjs`.
- Do not edit scoring values in `GUIDE.md` or `GUIDE.template.md` manually; use config-path tokens in the template and render them from `quiz.config.json`.

## Quiz Format

- The quiz contains 25 questions.
- Present the questions as a 5-by-5 grid of boxes.
- Clicking a box reveals its question.
- Questions 1, 5, 21, and 25 use the **Wordle** format.
- Questions 7, 9, 17, and 19 use the **String Theory** format.
- Question 13 uses a unique category called **Forbidden**.
- Every other question uses the **Ladders** format.

### Format Map

**Legend:** <span style="color:#16803c">● Wordle</span> · <span style="color:#2563eb">● String Theory</span> · <span style="color:#c56a00">● Ladders</span> · <span style="color:#dc2626">● Forbidden</span>

| | | | | |
|---|---|---|---|---|
| <span style="color:#16803c"><strong>1</strong></span> | <span style="color:#c56a00"><strong>2</strong></span> | <span style="color:#c56a00"><strong>3</strong></span> | <span style="color:#c56a00"><strong>4</strong></span> | <span style="color:#16803c"><strong>5</strong></span> |
| <span style="color:#c56a00"><strong>6</strong></span> | <span style="color:#2563eb"><strong>7</strong></span> | <span style="color:#c56a00"><strong>8</strong></span> | <span style="color:#2563eb"><strong>9</strong></span> | <span style="color:#c56a00"><strong>10</strong></span> |
| <span style="color:#c56a00"><strong>11</strong></span> | <span style="color:#c56a00"><strong>12</strong></span> | <span style="color:#dc2626"><strong>13</strong></span> | <span style="color:#c56a00"><strong>14</strong></span> | <span style="color:#c56a00"><strong>15</strong></span> |
| <span style="color:#c56a00"><strong>16</strong></span> | <span style="color:#2563eb"><strong>17</strong></span> | <span style="color:#c56a00"><strong>18</strong></span> | <span style="color:#2563eb"><strong>19</strong></span> | <span style="color:#c56a00"><strong>20</strong></span> |
| <span style="color:#16803c"><strong>21</strong></span> | <span style="color:#c56a00"><strong>22</strong></span> | <span style="color:#c56a00"><strong>23</strong></span> | <span style="color:#c56a00"><strong>24</strong></span> | <span style="color:#16803c"><strong>25</strong></span> |

## Topical Categories

- Treat the `topics` object in `quiz.config.json` as the sole source of truth for topic names and question assignments.
- The interactive quiz must read each topic's display name from `topics.<topicId>.name` and its assigned questions from `topics.<topicId>.questionNumbers`.
- Do not hard-code topic display names outside `quiz.config.json`; the map below is a documentation view of the config assignments, while the application must read the assignments directly from the config.

### Topic Map

The labels below reflect the display names configured in `quiz.config.json`.

**Legend:** <span style="color:#7c3aed">● Border</span> · <span style="color:#0f766e">● Renaming</span> · <span style="color:#b45309">● Structures</span> · <span style="color:#2563eb">● Scriptures</span> · <span style="color:#be185d">● Political Thinkers</span> · <span style="color:#16803c">● Numbers</span> · <span style="color:#dc2626">● Connector</span>

| | | | | |
|---|---|---|---|---|
| <span style="color:#7c3aed"><strong>1</strong></span> | <span style="color:#0f766e"><strong>2</strong></span> | <span style="color:#0f766e"><strong>3</strong></span> | <span style="color:#0f766e"><strong>4</strong></span> | <span style="color:#7c3aed"><strong>5</strong></span> |
| <span style="color:#b45309"><strong>6</strong></span> | <span style="color:#16803c"><strong>7</strong></span> | <span style="color:#0f766e"><strong>8</strong></span> | <span style="color:#16803c"><strong>9</strong></span> | <span style="color:#2563eb"><strong>10</strong></span> |
| <span style="color:#b45309"><strong>11</strong></span> | <span style="color:#b45309"><strong>12</strong></span> | <span style="color:#dc2626"><strong>13</strong></span> | <span style="color:#2563eb"><strong>14</strong></span> | <span style="color:#2563eb"><strong>15</strong></span> |
| <span style="color:#b45309"><strong>16</strong></span> | <span style="color:#16803c"><strong>17</strong></span> | <span style="color:#be185d"><strong>18</strong></span> | <span style="color:#16803c"><strong>19</strong></span> | <span style="color:#2563eb"><strong>20</strong></span> |
| <span style="color:#7c3aed"><strong>21</strong></span> | <span style="color:#be185d"><strong>22</strong></span> | <span style="color:#be185d"><strong>23</strong></span> | <span style="color:#be185d"><strong>24</strong></span> | <span style="color:#7c3aed"><strong>25</strong></span> |

## Format Descriptions

### Wordle

- Provide three one-word clues leading to a one-word answer.
- Each clue and its answer contain the same number of letters.
- Color the letters of the clues using the exact standard Wordle matching rules, including correct repeated-letter handling, to show their relationship to the answer.
- Reveal the three clues one at a time.
- After each clue is revealed, the participant gets one guess.
- Each guess must contain exactly the same number of letters as the answer.
- Apply exact Wordle-style coloring to every submitted guess as well as to the clues.
- A correct answer after each clue earns the corresponding reward configured in `scoring.wordle.clueRewards`.

### Ladders

- Provide exactly three progressively easier clues leading to one answer.
- The three clues use the progressively decreasing rewards configured in `scoring.ladders.clueRewards`.
- Revealing each additional clue reduces the maximum available score accordingly.

### String Theory

- Provide four clues connected by one common theory.
- The player must identify the shared connection. The connection may be any common theme and does not need to be a literal named theory.
- Reveal the four clues one at a time, allowing an answer after each reveal.
- A correct answer after each clue earns the corresponding reward configured in `scoring.stringTheory.clueRewards`.

### Forbidden

- Question 13 is locked and forbidden from being opened until all other 24 questions have been opened and answered.
- The player must identify the common theme connecting the answers to all of the other 24 questions.
- The Forbidden question uses the reward configured in `scoring.forbidden.reward`.

## Answering and Scoring

- Keep every numerical point value in `quiz.config.json`. The interactive quiz must read scoring values from this config rather than hard-coding them, so the game can be rebalanced in one place.
- The quiz is played by two opposing teams.
- Require the quizmaster to enter both team names before the game begins.
- In every question format, the active team may submit an answer after each clue is revealed without incurring a penalty for an incorrect attempt.
- Revealing another clue still changes the maximum available score according to the applicable format's configured clue rewards.
- For the 24 non-Forbidden questions, the teams take turns one by one as the active team.
- On its turn, the active team may choose any unopened non-Forbidden box; questions do not need to be played in numerical order.
- Opening a question commits the player to answering it; an answer must be submitted before that question is completed.
- After an incorrect clue-stage attempt, do not reveal the correct answer; allow the active team to reveal the next clue and try again.
- As soon as the active team gives the correct answer, reveal all remaining clues, if any.
- Once the active team's attempt is resolved, the quizmaster reveals the correct answer and manually assigns any points earned.
- If the active team fails to answer correctly, pass the question to the opposing team for the flat reward configured in `scoring.pass.reward`, regardless of the question's format or how many clues were revealed.
- When a question passes, reveal all of its remaining clues before the opposing team answers.
- A pass does not change the underlying turn order; regular alternation continues with the team that was already due to take the next turn.
- Award an answered question's grid cell to the team that answers it correctly, including when the opposing team wins it on a pass.
- If neither the active team nor the opposing team answers correctly, turn the cell into a permanent **Black Hole**.
- A Black Hole belongs to neither team, remains permanently blocked, and must be displayed as a distinct cell state separate from unopened, open, and team-owned cells.
- A Black Hole still counts as an attempted question for the purpose of unlocking the Forbidden question.
- The Forbidden question is open to both teams simultaneously rather than belonging to one team's turn.
- Only the first team to answer Forbidden correctly earns its points and its grid cell; the other team does not score it.
- The application must automatically maintain and sum the score tally from the quizmaster's point assignments.
- By default, the quizmaster may select only the point value currently available under the applicable format and reveal stage. Provide a separate custom-points override for exceptional cases.
- A non-Forbidden question counts as attempted only after it has been opened and its answer has been submitted.

## Bingo

- The game includes an additional Bingo scoring component based on the 5-by-5 question grid.
- A team makes a Bingo by completing any horizontal line, vertical line, diagonal line, or any one of the four directional regions: Top, Left, Right, or Bottom.
- Only the two full corner-to-corner diagonals count as diagonal Bingo patterns.
- Each Bingo awards the bonus configured in `scoring.bingo.reward`.
- Making a Bingo does not end the game.
- Teams may earn multiple Bingo bonuses during the game.
- Award each distinct Bingo pattern at most once to each team. A completed pattern must never be awarded repeatedly after later game actions or score edits.
- A Black Hole cannot contribute to any horizontal, vertical, diagonal, or directional-region Bingo for either team.
- Every Bingo pattern containing a Black Hole is permanently impossible for both teams.
- Example: if Team A wins boxes 1–5, it earns a Bingo for the first row. If it later wins boxes 6–10, it earns another Bingo for the second row. Each row is a separate pattern.
- Because both full diagonals include Question 13, its cell counts only for the team that answers Forbidden correctly first.
- The application must detect completed Bingos and add their bonuses to the automated score tally.
