# Bookclub

Bookclub is a web app for writing and publishing several books at once. A portfolio board shows every book's stage, a Today screen tracks the day's word target, and a Club screen posts weekly check-ins. Everything is saved to your own Google Sheet.

Live: <https://sherol.github.io/bookclub/>

It shows sample data until you connect a Google Sheet. The design behind it is in [docs/design.md](docs/design.md).

## Contents

- [Features](#features)
- [Sign-in and your Google Sheet](#sign-in-and-your-google-sheet)
- [Development](#development)
- [Deployment](#deployment)
- [Project layout](#project-layout)
- [License](#license)

## Features

- **Portfolio board:** a column for each stage (Inventory, Outline, Drafting, Revision, Editing, Production, Launch, Backlist) with the stage's exit criteria. Each card shows the series and position, words written against the target, and, while drafting, the words needed per day and the draft due date.
  - **Move to** changes a book's stage. Drafting and Revision hold one book each; the board says which book to move on first.
  - **+ Add a book** adds a title, series, stage, target words, draft due date and publishing path (Self or Traditional).
  - Tiles show whether the Drafting and Revision slots are open, and the words written in the last 7 days.
- **Today:** pick a book to see the words written today against today's target (remaining words ÷ days to the draft due date), your pace in words per hour, and a form to log a session (words and minutes). Below it, open tasks from the Tasks tab that are overdue, undated or due within a week, with a checkbox to mark them done.
- **Club:** a weekly check-in form pre-filled with your words this week (this week, win, stuck on, ask, next week), and recent check-ins newest first. Your name is remembered in the browser, or taken from your Google account.
- **Home-screen app:** a web manifest and icons, so it can be added to an iPhone or Android home screen and opens full screen.

Book titles, member names and numbers in the sample data are placeholders in [brackets].

## Sign-in and your Google Sheet

- **Sign-in:** **Connect Google Sheet** opens Google's sign-in window through Firebase Auth, using the same Firebase project and OAuth client as [SheetSync](https://github.com/sherol/sheetsync). The Firebase web config in `src/google/auth.ts` is public; there is no client ID or secret to set.
- **Permission:** the app asks only for `drive.file`, so it sees the files it created and nothing else in your Drive.
- **First connect:** the app creates a **Bookclub** folder in your Drive and, inside it, a spreadsheet called **Bookclub**. Every tab gets a bold, frozen header row, and the Stage, Publishing path and Status columns get dropdowns.
- **Later connects:** the folder and sheet are found again by a tag the app sets on them (Drive `appProperties`). A Bookclub sheet made before the folder existed is moved into it.
- **Tabs:** Dashboard (books per stage), Books, Series, Chapters, Story bible, Milestones, Tasks, Contributors, Sessions and Club. The app reads and writes Books, Sessions, Tasks and Club; the other tabs are set up for you to fill in the sheet.
- **Editing the sheet:** rows you add or change in the sheet show up in the app. Columns are read by header name, so don't rename the headers. **Current words** on the Books tab is a formula that totals the Sessions tab; don't type over it.
- **Staying connected:** the Google access token is kept in memory only and lasts about an hour, for the open page. When it runs out, or after a reload, click **Reconnect**. Your data is in the sheet, not the browser. The browser only remembers that you connected before (to label the button) and your Club name.

[docs/google-setup.md](docs/google-setup.md) lists what the shared Firebase and Google Cloud project needs (authorized domain, Sheets and Drive APIs, the `drive.file` scope, test users) and what isn't built yet.

## Development

Requirements: Node.js 22 (as in CI; Vite needs 20.19 or newer).

```sh
npm install
npm run dev       # dev server on http://localhost:5173/bookclub/
npm test          # unit tests (vitest, jsdom)
npm run build     # type check (tsc -b) and production build in dist/
npm run preview   # serve dist/ locally
```

There is no lint script; `npm run build` runs the type check.

Sign-in works on `localhost`, which Firebase allows by default.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which installs, tests, builds, and publishes `dist/` to GitHub Pages. It can also be run by hand from the Actions tab.

The site is served from `/bookclub/`, set by `base` in `vite.config.ts`. Rename the repo and that path has to change too. In the repository's **Settings → Pages**, **Source** should be **GitHub Actions**.

## Project layout

| Path | Contents |
|---|---|
| `src/App.tsx` | Top bar, routes (`#/board`, `#/today`, `#/club`), connect and sign-out, error and Reconnect banners |
| `src/screens/Board.tsx`, `Today.tsx`, `Club.tsx` | The three screens |
| `src/store.ts` | The `Store` the screens use: `SheetStore` (your Google Sheet) and `DemoStore` (sample data in memory) |
| `src/google/auth.ts` | Google sign-in through Firebase Auth; the access token stays in memory |
| `src/google/sheets.ts` | Sheets and Drive API calls: find or create the folder and sheet, read tabs, append rows, update cells |
| `src/schema.ts` | Stages, exit criteria, every tab's headers, the Current words formula, data types |
| `src/calc.ts` | Dates (including Sheets serial numbers), daily word target, number formatting |
| `src/Logo.tsx`, `src/styles.css` | The squirrel logo and the styles |
| `src/*.test.ts`, `src/google/*.test.ts` | Unit tests |
| `public/` | Favicon, home-screen icons and web manifest |
| `docs/design.md` | Design doc for the multi-book writing and publishing system, exported from the Claude Doc that is its source of truth |
| `docs/google-setup.md` | Google sign-in setup and sheet details |
| `design/` | The squirrel logo (`logo.svg`) and the app mock (see [design/README.md](design/README.md)) |

## License

Apache License 2.0. See [LICENSE](LICENSE).
