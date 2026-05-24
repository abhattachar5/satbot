# progress.js — SATBot Phase 0 data layer

Local-storage progress tracking for satbot.co.uk. No backend, no dependencies, no build step.

## How to include

```html
<script src="/progress.js"></script>
```

`window.ProgressStore` is then available on every page.

## Hello world

```js
const store = new ProgressStore();

await store.recordAttempt({
  paperCode: 'maths-2023-paper1',
  subject:   'maths',
  score:     34,
  maxScore:  40,
  durationSeconds: 1500,
  questionResults: [
    { qId: 'q1', topic: 'fractions', correct: true,  timeSeconds: 30 },
    { qId: 'q2', topic: 'algebra',   correct: false, timeSeconds: 60 },
  ]
});

const summary = await store.getSummary();
console.log(summary.overallAveragePercent); // 85
```

## Running the tests

Open `progress.test.html` in any browser — no server needed. All tests run automatically and a pass/fail summary appears at the top of the page. Individual failures show the expected vs. actual value inline.

## Design notes

- **All methods return Promises** even though the underlying storage is synchronous. This means `progress.js` can be replaced with a server-backed implementation in Phase 1 without changing any caller code.
- **Single localStorage key** (`satbot_progress_v1`). One JSON blob, schema-versioned.
- **Corruption recovery**: if the blob can't be parsed, the store resets to empty and sets a `corruptionDetected` flag that the dashboard reads to show a banner.
- **Injectable clock**: pass `{ _clock: () => new Date(...) }` to the constructor for deterministic testing of streak logic.
- **Achievement metadata** (display names, icons, descriptions) is available at `ProgressStore.ACHIEVEMENT_META`.
