# Interactive Course Template

A zero-dependency, single-file HTML course builder. Drop in your content, open in a browser — done. No build tools, no frameworks, no server required.

**Features:**
- Sidebar navigation with progress tracking
- Expandable lecture sections
- Per-lesson quizzes with instant feedback
- Click-to-reveal flashcards
- Expandable Q&A bank
- Final readiness checklist
- Dark theme, fully responsive

---

## Quick Start

1. Open `course.html` in any text editor
2. Scroll to the `COURSE_DATA` object near the top of the `<script>` tag
3. Fill in your content following the guide below
4. Open `course.html` in a browser — no build step needed

---

## Populating the Course

Everything lives inside the `COURSE_DATA` object. The engine reads it and renders the full course automatically.

### 1. Meta fields

```js
title:       "Your Course Title",
subtitle:    "Topic · Level · Year",
welcomeText: "One paragraph describing what this course covers.",
stats: [
  { num: "12",  label: "Lessons" },
  { num: "~4h", label: "Study Time" },
  { num: "10",  label: "Q&A Answers" },
  { num: "25",  label: "Flashcards" }
],
```

### 2. Sidebar sections

Group your lesson pages into labelled sidebar sections. `pages` is an array of page indices (1-based — page 0 is always the Welcome page).

```js
sidebarSections: [
  { label: "Section 1 — Introduction",  pages: [1, 2, 3] },
  { label: "Section 2 — Core Concepts", pages: [4, 5, 6] },
  { label: "Section 3 — Advanced",      pages: [7, 8] }
],
```

If you add more lesson pages, update this array to include their indices.

### 3. Lesson pages

Each object in `pages[]` becomes one lesson page. Pages are rendered in array order starting at index 1.

```js
pages: [
  {
    nav:      "Short Sidebar Label",          // shown in sidebar
    badge:    "Section 1 · Lecture 1",        // tag above title
    title:    "Full Page Title",
    subtitle: "What this lesson covers",
    content:  `...HTML string...`,            // lecture body (see below)
    quiz: [                                   // leave as [] for no quiz
      {
        q:       "Your question?",
        opts:    ["Option A", "Option B", "Option C", "Option D"],
        correct: 0                            // 0-based index of correct answer
      }
    ]
  },
  // ... more pages
]
```

#### Writing `content` HTML

The `content` field is a raw HTML string. Use template literals (backticks) for multi-line content. The following CSS helper classes are available:

| Class | Use for |
|---|---|
| `.lecture` + `.lecture-header` + `.lecture-body` | Collapsible lecture block (see example in template) |
| `.callout` | Highlighted quote or definition box |
| `.callout.success` / `.warning` / `.danger` | Colour variant callouts |
| `.tip` | Hint box with emoji icon |
| `.data-table` | Styled table |
| `.badge-success` / `.badge-danger` / `.badge-warning` / `.badge-accent` | Inline coloured badge |
| `.highlight` | Teal bold text |
| `.red` / `.gold` | Red / yellow bold text |
| `<h3>` | Section sub-heading |
| `<code>` | Inline code |
| `<pre>` | Code block |

**Collapsible lecture block pattern:**

```html
<div class="lecture open">
  <div class="lecture-header" onclick="toggleLecture(this)">
    <div class="lecture-num">1.1</div>
    <div class="lecture-meta">
      <div class="lecture-title">Lecture Title</div>
      <div class="lecture-time">⏱ 10 min</div>
    </div>
    <div class="lecture-chevron">▼</div>
  </div>
  <div class="lecture-body">
    <p>Your lecture content here.</p>
    <div class="callout">A key quote or definition.</div>
    <h3>Sub-section</h3>
    <table class="data-table">
      <thead><tr><th>Col A</th><th>Col B</th></tr></thead>
      <tbody>
        <tr><td>Value</td><td>Value</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

Add multiple `.lecture` blocks on a single page for multi-part lessons. Remove `open` from the class list to start a block collapsed.

### 4. Quiz questions

Each lesson page can have zero or more quiz questions. Leave `quiz: []` for no quiz.

```js
quiz: [
  {
    q:       "What is X?",
    opts:    ["Answer A", "Answer B", "Answer C", "Answer D"],
    correct: 1    // Answer B is correct (0-based index)
  }
]
```

The quiz renders automatically at the bottom of the lesson page with instant feedback and a final score.

### 5. Flashcards

```js
flashcards: [
  { q: "Question on the front?", a: "Answer on the back" },
  { q: "Another question?",      a: "Another answer" }
]
```

Learners click each card to reveal the answer. A counter tracks how many have been revealed.

### 6. Q&A Bank

For exam-prep or scripted answers to hard questions:

```js
qa: [
  {
    q: "Hard question the examiner might ask?",
    a: "Your scripted answer. <strong>Bold key phrases.</strong>"
  }
]
```

Renders as a collapsible accordion — learners try to answer before revealing.

### 7. Final checklist

```js
checklist: [
  "I can explain X in one sentence",
  "I have completed Y",
  "I know the answer to Z"
]
```

Renders as a clickable checklist with completion counter.

---

## Adding More Pages

1. Add a new object to the `pages[]` array
2. Add its index to the appropriate entry in `sidebarSections`
3. That's it — the engine handles rendering, navigation, and progress tracking

---

## Customising the Theme

Change the CSS custom properties at the top of `<style>` to match your branding:

```css
:root {
  --accent:  #6c63ff;   /* primary colour (sidebar, badges, buttons) */
  --accent2: #00d4aa;   /* secondary colour (correct answers, progress) */
  --accent3: #ff6b6b;   /* danger / red highlights */
  --accent4: #ffd93d;   /* gold / warning highlights */
}
```

---

## File Structure

```
course.html    — the entire application (single file, no dependencies)
README.md      — this file
```

No build step. No npm. No server. Just open `course.html` in a browser.

---

## License

MIT — use freely for personal or commercial courses.
