# Quizingo slide deck

This draft is a clickable 5 × 5 RevealJS quiz board generated from
`question-bank.json` and `quiz.config.json`.

Render the self-contained deck with Quarto 1.8.26:

```sh
quarto render index.qmd
```

The result is `_site/index.html`. The pre-render step validates the question
numbers, formats, clue counts, Wordle word lengths, topics, and score arrays,
then creates the ignored intermediate file `quiz.generated.md`.

Open `_site/index.html` in a modern desktop browser. Enter two player names on
the setup slide, then use **Record result** on each answer slide to assign the
cell and points. Completed cells can be clicked on the board to edit their
result. Running totals automatically include each newly completed row, column,
diagonal, or directional-region Bingo at the configured reward. Names, scores,
clue stages, cell states, and awarded Bingos are retained in
`sessionStorage` for that browser tab; use **Reset Game** to clear everything.

Wordle questions accept one same-length guess at each revealed clue, colour the
submitted letters using standard repeated-letter matching, and retain attempts
for the browser session.
