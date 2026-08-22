# NPTEL Distributed Systems 2026

## distributed::systems — NPTEL revision hub
A one-stop study site for NPTEL Distributed Systems: summary notes, slide
references, MCQs with worked solutions, and flashcard-based active recall —
built up one week at a time.

No backend. All content lives in plain TypeScript data files, so it deploys
as a static site and costs nothing to host.

---
##### Disclaimer: This is an independent, community-built study resource for NPTEL Distributed Systems 2026. It is not affiliated with, endorsed by, sponsored by, or officially associated with NPTEL, IITs, or any other institution mentioned in the course materials. All NPTEL course content, trademarks, and related materials remain the property of their respective owners.
---

## Stack
- React + TypeScript + Vite
- Tailwind CSS v4
- React Router (client-side routing)
- react-markdown (renders note sections)

## Structure

```
src/
  data/weeks/
    week1.ts        # one file per week — notes, slides, mcqs, flashcards
    week2.ts ...
    index.ts         # registers all 8 weeks
  types/index.ts      # shared shape for WeekData, Mcq, Flashcard, etc.
  components/
    TopologyMap.tsx   # the 8-node progress map (home page + per-week header)
    NotesView.tsx
    SlidesView.tsx
    McqView.tsx
    FlashcardView.tsx
  pages/
    Home.tsx
    WeekPage.tsx       # tabs: Notes / Slides / MCQs / Flashcards
```

## Adding a week's content

Open `src/data/weeks/weekN.ts` and fill in the `WeekData` object:

```ts
const week2: WeekData = {
  week: 2,
  title: "Time, Clocks, and Ordering of Events",
  status: "ready", // "empty" | "in-progress" | "ready"
  notes: [
    { heading: "Lamport clocks", body: "markdown text here..." },
  ],
  slides: [
    { label: "Lecture 2.1 — Logical clocks", url: "https://...", note: "key idea" },
  ],
  mcqs: [
    {
      id: "w2-q1",
      question: "...",
      options: ["A", "B", "C", "D"],
      correctIndex: 1,
      explanation: "...",
    },
  ],
  flashcards: [
    { id: "w2-f1", front: "What is a Lamport timestamp?", back: "..." },
  ],
};
```

Then register it in `src/data/weeks/index.ts` in place of the `emptyWeek(2, ...)`
placeholder. Setting `status: "ready"` lights up that node green on the
topology map.

## Local development

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Framework preset: Vite. Build command: `npm run build`. Output dir: `dist`.
   (`vercel.json` is already set up to handle client-side routing.)
4. Deploy. Every push to `main` auto-redeploys.

Or from the CLI: `npx vercel --prod` from this directory.
