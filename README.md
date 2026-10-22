# EventScrunch

Community desk for a lead. One event brief becomes a run sheet, budget, volunteer rota, template poster, and posts. Nothing is treated as sent until the lead approves it.

## Stack

- **TypeScript** + **React**
- **TanStack Start** (Vite, file-based routes)
- **Tailwind CSS**
- **Zustand** with browser `localStorage` (no account, no database required)
- SVG posters from a code template (not an image model)
- Optional Grok polish (only when the lead clicks it)
- Read-only Luma London feed for the weekly digest

## What it does

- Drafts a run sheet, budget, rota, event page, Ghost-style newsletter, WhatsApp / LinkedIn / Discord copy, and a night-of update from one brief.
- Approval gate on every piece. Copy-out stays locked until approved.
- Interest replies shape catering, seating notes, and the rota.
- Budget states over/under the cap in words and does not double-count food receipts.
- Poster is an SVG template (story or wide). Download it.
- Exports: Notion markdown, calendar `.ics` (Europe/London), approved post text.
- Hours saved are shown on the desk (5 h 29 min writing per pack; 2 min left on the lead per unapproved piece).

## What it does not do

- No live send to Ghost, WhatsApp, LinkedIn, Discord, or Notion.
- No write-back to Luma.
- No image-model posters.
- No accounts. Packs stay in this browser.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to port 8080).

## Licence

MIT
