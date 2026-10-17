# Multi-Book Writing & Publishing System — Design Doc

Exported Oct 17, 2026 from the [Claude Doc](https://claude.ai/artifact/Rkx2XgsePUuqeUQvBk5dB7), which is the source of truth. Diagrams are described in text below.

## Overview & goals

This system gives one author (or a small team) a single place to plan, write, produce and launch several books at once, so no book stalls and no deadline is missed. It treats every book as a project moving through the same stages, and treats the author's time as a shared, limited resource across all of them. People use it through an AI-assisted web app hosted on GitHub Pages, with the Google Sheet as its only data store.

Success looks like this:

- **Visibility:** at any moment you can see every book's stage, next deadline and blocker on one page.
- **Steady output:** daily and weekly word-count targets are set per book and tracked against actual progress.
- **No collisions:** heavy phases (drafting, launch) for different books are staggered, not stacked in the same month.
- **Repeatable publishing:** every book follows the same checklist from final draft to live listing, so nothing (ISBN, back-cover copy, ARC readers) is forgotten.
- **Continuity:** characters, settings and facts shared across a series live in one story bible, not scattered notes.

## Scope & non-goals

In scope is everything between "I have an idea for a book" and "the book is live and its launch is finished," for 2 to 10 books in flight at once.

**In scope**

- A trailhead inventory of every book you want to write, ranked and grouped
- Outlining, drafting and revision tracking per book
- Series-level continuity (story bible, timeline, recurring characters)
- Production: editing, cover, interior formatting, metadata
- Publishing to retailers or handoff to a traditional publisher
- Launch and marketing tasks tied to a release date, plus an optional writing club

**Non-goals**

- Replacing the writing app itself — drafts stay in Scrivener, Word, Google Docs or similar; this system links to them.
- Full accounting or royalty reconciliation — only headline sales and costs per book are tracked.
- Agent querying at scale — tracked as a simple stage, not a CRM.

## Trailhead: the book inventory

The process starts with one guided session that captures every book you want to write — not just the next one — so planning works from the full list instead of whatever is loudest.

The session runs in three steps, about 60–90 minutes the first time:

1. **Brain dump.** List every book idea, finished or barely formed, without judging. Include abandoned drafts and "someday" ideas.
2. **Interview each book.** Answer the same short set of questions for each one (table below). Blank answers are fine; they become open questions.
3. **Rank and group.** Cluster books into series or standalones, then rank by excitement, readiness and fit with your goals. The top-ranked books get a target release year.

| Question | Why it matters | Lands in |
| --- | --- | --- |
| Working title and one-line premise | Makes the book concrete and comparable | Books tab |
| Genre and audience | Drives length, cover style, categories | Books tab |
| Standalone or part of a series? Which position? | Sets reading order and continuity needs | Books, Series tabs |
| How much exists today (notes, outline, words)? | Shows readiness and starting stage | Books tab |
| Rough target length | Feeds the daily word target later | Books tab |
| Why this book, why now? | Tie-breaker when ranking | Books tab (notes) |
| Excitement (1–5) and readiness (1–5) | Basis for the ranking | Books tab |
| Hard dates (contract, event, anniversary)? | Fixes the schedule around real constraints | Milestones tab |
| Key characters, places, rules already decided | Seeds the story bible from day one | Story bible tab |

The inventory is revisited at every quarterly planning session: new ideas are added through the same questions, and the ranking is redone.

## Core concepts & data model

Eight record types cover the whole system; Book is the center, and everything else hangs off it or off a Series. Each becomes a tab in the Google Sheet, alongside a Club tab for the optional writing club.

| Record | What it holds | Key fields | Links to |
| --- | --- | --- | --- |
| Series | A group of related books | Name, planned book count, reading order | Books, Story bible |
| Book | One title in progress or published | Working title, series #, genre, stage, target word count, release date, priority | Series, Chapters, Milestones, Tasks, Contributors |
| Chapter | A unit of the manuscript | Number, POV, word count, draft status, revision pass | Book |
| Milestone | A dated checkpoint | Name, due date, done date, gate criteria | Book |
| Task | A single action | Title, owner, due date, status, stage | Book, Milestone |
| Contributor | Anyone besides the author | Name, role (editor, cover designer, narrator, beta reader), rate, contact | Books, Tasks |
| Story bible entry | A continuity fact | Type (character, place, item, rule), description, first appearance | Series, Books |
| Asset | A file tied to a book | Type (cover, interior PDF, ebook file, blurb), version, link | Book |

Two rules keep the data clean:

1. A Book is always in exactly one stage (see the lifecycle below).
2. Word count is rolled up from Chapters, never typed on the Book by hand.

## Book lifecycle

Every book sits in exactly one of eight stages and moves forward only when that stage's exit gate is met.

**Diagram (as text): eight stages in order, each with its exit gate**

| # | Stage | What happens / exit gate |
| --- | --- | --- |
| 1 | Inventory | Premise in one line; series fit chosen; priority ranked |
| 2 | Outline | Chapter outline; target word count; draft date set |
| 3 | Drafting (highlighted) | One book at a time; daily word target; exit: full draft |
| 4 | Revision | Five named passes; beta readers' notes; exit: revised draft |
| 5 | Editing | Dev and copy edit; proofread; exit: locked text |
| 6 | Production | Cover, interior; ISBNs, metadata; exit: proof approved |
| 7 | Launch | 8 weeks before to 4 weeks after release; exit: retrospective |
| 8 | Backlist | Back-matter links; evergreen ads; sales tracked |

Drafting is highlighted because it is the scarce stage: only one book drafts at a time. If editing returns major structural notes, the book steps back to Revision rather than patching in Production.

## Planning & portfolio scheduling

Books are scheduled as a portfolio against one capacity rule: at most one book in Drafting and one in Revision at any time, with production and launch running alongside.

**Diagram (as text): example cadence — four books over four quarters, one stage per book per quarter**

| Book | Quarter 1 | Quarter 2 | Quarter 3 | Quarter 4 |
| --- | --- | --- | --- | --- |
| Book A | Revision | Production | Launch | Backlist |
| Book B | **Drafting** | Revision | Production | Launch |
| Book C | Outline | **Drafting** | Revision | Production |
| Book D | Idea | Outline | **Drafting** | Revision |

Drafting: one book per quarter; the Quarter 4 slot is free for the next book.

Each new book is placed by working backward from its release date using the lead times in the publishing workflow, then checking that its Drafting window doesn't overlap another book's.

**Planning cadence**

- **Weekly review (20 minutes):** update word counts, tick off tasks, check next week's deadlines across all books.
- **Quarterly planning (1–2 hours):** re-rank the idea backlog, confirm next quarter's drafting slot, book editors and designers for releases 16+ weeks out.
- **Yearly roadmap:** target release months for the next 12–18 months, so series readers get books at a predictable rhythm.

## Writing workflow

Each book in drafting gets a daily word target derived from its deadline, and only one book is in active drafting at a time.

**Setting the target.** Daily target = (target word count − current word count) ÷ writing days left before the draft milestone. Example: an 85,000-word novel at 20,000 words with 65 writing days left needs 1,000 words a day. If the target rises above your proven pace for two weeks running, the system flags the book and the draft milestone moves.

**Session log.** Each writing session records date, book, words added and minutes spent. This produces your real pace (words per hour), which feeds every future schedule.

**Revision passes.** Revisions run as named passes, each with its own checklist, tracked per chapter:

1. Structural pass — plot holes, pacing, chapter order
2. Character and continuity pass — checked against the story bible
3. Line edit — prose, dialogue, repetition
4. Beta-reader pass — feedback collected, triaged, applied
5. Polish — final read, ideally aloud or with text-to-speech

**Story bible.** Any new name, place or rule invented while drafting gets an entry the same day. Before a book enters revision, its continuity pass compares the manuscript against every bible entry for the series.

## Publishing workflow

Production runs on a fixed checklist with lead times counted back from the release date; most items can run in parallel once the manuscript is locked.

| Item | Owner | Lead time before release | Depends on |
| --- | --- | --- | --- |
| Book editor booked | Author | 16 weeks | Draft milestone date set |
| Cover designer booked | Author | 16 weeks | Title, genre, series look |
| Developmental / copy edit returned | Editor | 10 weeks | Revised draft |
| Cover final (ebook + print wrap) | Designer | 8 weeks | Page count for spine |
| Proofread returned | Proofreader | 7 weeks | Copy edit applied |
| Manuscript locked | Author | 6 weeks | Proofread applied |
| ISBNs assigned (ebook, paperback, hardcover, audio) | Author | 6 weeks | Formats decided |
| Metadata: blurb, categories, keywords, price | Author | 6 weeks | Final title |
| Interior formatted (EPUB + print PDF) | Author or formatter | 5 weeks | Manuscript locked |
| Print proof ordered and checked | Author | 4 weeks | Interior + cover |
| Pre-order live | Author | 4 weeks | Files + metadata |
| Final files uploaded to all retailers | Author | 1 week | Proof approved |

For traditionally published books, the same list applies but most owners become "publisher"; the system still tracks the dates so the author knows what to expect and when.

## Marketing & launch

Every book gets a launch window of 8 weeks before to 4 weeks after release, generated from a template so each launch starts with the same task list.

- [ ] 8 weeks out: cover reveal to newsletter and socials
- [ ] 6 weeks out: recruit advance reader (ARC) team; send ARCs
- [ ] 4 weeks out: pre-order announcement; update back matter of earlier books in the series with a link
- [ ] 2 weeks out: schedule promo sites, ads and newsletter swaps
- [ ] Release week: launch email, social posts, ARC readers reminded to review
- [ ] 2 weeks after: first ad review — pause what isn't converting
- [ ] 4 weeks after: launch retrospective (sales, reviews, what to reuse)

Across books, marketing assets stay reusable: one author bio, one series description, and an evergreen ad set per series that each new release extends rather than rebuilds.

## Writing club (optional)

An optional club of 3–6 writers gives each member steady updates, suggestions and encouragement, using a light weekly rhythm so it supports the writing instead of competing with it.

**Rhythm**

| Cadence | Format | Time |
| --- | --- | --- |
| Weekly | Async check-in: each member posts a short update | 5 minutes each |
| Every 2 weeks | Reply round: each member answers at least two others' asks | 15 minutes each |
| Monthly | Live call (video or in person): one member in the spotlight shares pages or a plan for feedback | 60 minutes |
| Each launch | Club helps as first ARC readers and launch-week cheerleaders | As needed |

**Weekly check-in template**

```markdown
Book: <title> — stage: <stage>
This week: <words written / milestone hit>
Win: <one thing that went well>
Stuck on: <one problem, or "nothing">
Ask: <the specific help you want — a read, an opinion, a nudge>
Next week: <one goal>
```

**Roles and norms**

- **Host (rotates monthly):** posts the weekly prompt, runs the live call, nudges quiet members kindly.
- **Encourage first, suggest second.** Replies name something working before offering a change, and only offer suggestions the member asked for.
- **Small asks.** A read request is a chapter or a page of plan, not a whole manuscript, unless agreed.
- **Private by default.** Pages and plans shared in the club stay in the club.
- **Leaving is fine.** Members can pause for a season without explanation.

**Where it lives**

Updates are posted to a group chat (Slack, Discord, WhatsApp or a shared Google Chat space) and logged weekly in the Club tab of the sheet, so each member's history of goals and wins is easy to look back on. Each member can share a view-only copy of their Dashboard tab with the club if they want progress visible at a glance; the rest of their sheet stays private.

## Tools: one Google Sheet as the context hub

All context for every book lives in one Google Sheet, with one tab per record type, so there is a single link to open, share and back up. Drafts stay in your writing app; the sheet links to them.

| Tab | One row per | Key columns |
| --- | --- | --- |
| Dashboard | — (summary only) | Books by stage, next 10 milestones, words this week, club highlights |
| Books | Book (the inventory lives here) | Book ID, title, premise, series + position, genre, stage, target words, current words, excitement, readiness, rank, target release, draft link |
| Series | Series | Series ID, name, planned books, reading order, series description |
| Chapters | Chapter | Book ID, chapter #, POV, words, draft status, revision pass |
| Story bible | Character, place, item or rule | Series ID, type, name, description, first appearance (Book ID + chapter) |
| Milestones | Dated checkpoint | Book ID, milestone, due date, done date, gate criteria |
| Tasks | Action | Book ID, task, owner, stage, due date, status |
| Contributors | Person helping | Name, role, rate, contact, Book IDs |
| Sessions | Writing session | Date, Book ID, words added, minutes |
| Club | Club update | Date, member, book, update, ask, encouragement received |

**How the sheet works**

- **Book ID is the key.** Every other tab picks a Book ID from a dropdown (data validation over the Books tab), so rows always point to a real book.
- **Dropdowns for closed sets.** Stage, status, revision pass and story-bible type are dropdowns, so filters and counts stay clean.
- **Formulas do the rollups.** Current words on Books = SUMIFS over Chapters; words this week = SUMIFS over Sessions; daily target = remaining words ÷ writing days to the draft milestone.
- **Conditional formatting flags trouble.** Overdue milestones turn red; a daily target above your logged pace turns amber.
- **Protected ranges.** Formula columns and the Dashboard are locked so a stray edit doesn't break them.

A sheet is free, familiar and easy to share with editors and club members. Its limit is that links between tabs are by ID rather than true relations; past roughly 10 active books or many collaborators, moving the same tabs into Airtable is the natural upgrade.

## Frontend app on GitHub

The front end is a static, AI-assisted single-page app, in the style of a Google AI Studio app: its code lives in a GitHub repo, GitHub Actions builds it, and GitHub Pages serves it for free. It reads and writes the Google Sheet straight from the browser, so there is no server at all. AI help works by passing text documents back and forth with any AI chat, so no AI key is ever needed.

**Diagram (as text): architecture**

- GitHub repo (source code, no secrets) → GitHub Actions (builds on every push) → GitHub Pages (serves the static site).
- GitHub Pages → loads the **web app in the browser** (React + Vite, runs entirely client-side; screens: Trailhead, board, book, today, club).
- Web app ↔ **Your Google Sheet** (books, chapters, bible; read/write via Sheets API after Google sign-in).
- Web app ↔ **Club sheet** (shared with members; check-ins and replies).
- Web app ⇢ **Any AI chat** (Claude, Gemini, ChatGPT) — request and reply docs carried by hand by the user; no direct connection.

The app holds no data of its own; refreshing or switching devices loses nothing, because every change is written to the sheet.

**Screens**

| Screen | What it does | Sheet tabs used |
| --- | --- | --- |
| Trailhead | AI-guided interview through the inventory questions, one book at a time; writes each answer into a Books row | Books, Series, Story bible, Milestones |
| Portfolio board | Books as cards by stage; drag a card to change stage; quarter view shows the drafting stagger | Books, Milestones |
| Book page | Chapters, words vs. target, revision passes, publishing checklist with lead times | Chapters, Tasks, Milestones, Contributors |
| Today | This week's tasks, today's word target, one-tap session log | Tasks, Sessions |
| Story bible | Search and filter entries; continuity check of a pasted chapter | Story bible |
| Club | Post the weekly check-in from the template; read and reply to others | Club sheet |
| Dashboard | Books by stage, next milestones, weekly words | All |

**AI help through text documents**

The app never calls an AI itself. Each AI task is a handoff: the app writes a self-contained request document, you give it to any AI chat, and you bring the reply back.

1. **Request.** The app builds a Markdown request with the task, the relevant sheet rows (for example a book's inventory answers, or the story-bible entries for its series) and the exact reply format. One tap copies it or downloads it as a `.md` file.
2. **Reply.** You paste the request into Claude, Gemini, ChatGPT or another AI chat, work with it there as long as you like, and copy its final answer.
3. **Import.** You paste the reply, or upload it as a `.md` file, into the app. The app reads the structured part, previews every proposed change, and writes to the sheet only what you approve.

**Reply format.** Each request asks the AI to end with a fenced block the app can parse (for example a `book-update` block with one `field: value` per line). Text outside the block is kept as notes. If the block is missing or malformed, the app says so and offers a short "please reformat" follow-up to copy.

- **Trailhead interview:** the request carries the inventory questions and your brain-dump list; the AI interviews you in its own chat, then returns one block per book for the Books tab.
- **Continuity check:** the request carries a chapter and its series' story-bible rows; the reply lists conflicts.
- **Draft helpers:** blurb, categories and keywords from the premise; a weekly club check-in pre-filled from your Sessions and Tasks.
- **Rule:** nothing from a reply reaches the sheet without your click.

**Sign-in, keys and privacy**

- **Google sign-in** uses Google Identity Services. The OAuth client ID is public and safe to commit; the authorized origin is the Pages URL (for example `https://<username>.github.io`).
- **Narrow access:** request the `drive.file` scope, so the app sees only the sheet it creates on first run (all tabs set up automatically) or one the user picks — not the rest of their Drive.
- **No secrets anywhere.** The only setting is the public client ID, and AI access happens in your own AI chat, so the public repo and site hold nothing sensitive.
- **You choose what an AI sees.** A request document contains only the rows that task needs, and you read it before pasting it anywhere.
- **Club data** sits in one separate shared sheet; each member's own sheet stays private to them.

**Build and deploy**

1. Vite + React + TypeScript project in a public or private GitHub repo.
2. Public settings (Google client ID) stored as repository variables and read at build time.
3. A GitHub Actions workflow on every push to `main`: install, build, upload the `dist` folder, deploy to Pages.
4. Vite's `base` set to `/<repo-name>/` so assets load from the Pages subpath; a custom domain is optional.
5. If prototyping in Google AI Studio first, export the app's code to the repo and swap its built-in AI calls for the text-document handoff before the first deploy.

**Decisions for the app**

- Users: each club member signs in and uses the app with their own private sheet; one shared Club sheet joins them.
- AI chat: request documents stay neutral, so they work in Claude, Gemini, ChatGPT or any other AI chat.
- Hosting: the default GitHub Pages URL, https://sherol.github.io/bookclub/; a custom domain can be added later.

## Metrics, risks & next steps

**Metrics to watch**

- Words per week vs. target, per active book
- Milestones hit on time (%), across all books
- Days from draft complete to release
- Per book after launch: units sold in first 30 days, reviews count, production cost vs. revenue

**Risks**

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Two books' heavy phases overlap | Both slip | Capacity rule: one book drafting, one in revision, max |
| Editor or designer unavailable | Release date moves | Book contributors 16 weeks out; keep one backup per role |
| Pace estimate too optimistic | Cascading slips | Schedule from logged pace, not hoped-for pace; 15% buffer on drafts |
| System upkeep becomes a chore | Data goes stale, system abandoned | Weekly 20-minute review is the only required ritual |

**Open questions**

- Decided: a mix. Each book records its publishing path (self or traditional), which sets the default owner of its publishing tasks.
- How many books are in flight now, and which formats (ebook, print, audio) does each need?
- Which writing app holds the drafts, and should word counts sync automatically?

**Next steps**

- [ ] Answer the open questions above
- [ ] Choose a tool and build the eight record types
- [ ] Run the trailhead inventory session and enter every book in the Books tab
- [ ] Set up the weekly review
- [ ] Optional: invite 3–6 writers and start the weekly club check-in
