# Connecting Google Sheets

The app runs without this, on sample data. To save real books, it needs a Google OAuth client ID. The ID is public and safe to put in the repo settings; there is no secret.

## 1. Create the client ID (once, about 10 minutes)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project, for example **Bookclub**.
2. **APIs & Services › Library:** enable **Google Sheets API** and **Google Drive API**.
3. **APIs & Services › OAuth consent screen** (shown as **Google Auth Platform** in newer consoles):
   - User type **External**, app name **Bookclub**, your email as support and developer contact.
   - **Data access / Scopes:** add `https://www.googleapis.com/auth/drive.file`. This lets the app see only the sheet it creates, not the rest of anyone's Drive.
   - **Audience / Test users:** add your own Google account and each club member's. While the app is in "Testing", only these accounts can sign in.
4. **Credentials › Create credentials › OAuth client ID:**
   - Application type **Web application**.
   - **Authorized JavaScript origins:** `https://sherol.github.io` and, for local development, `http://localhost:5173`.
   - No redirect URIs are needed.
5. Copy the client ID (it ends in `.apps.googleusercontent.com`).

## 2. Give it to the site

In the GitHub repo: **Settings › Secrets and variables › Actions › Variables › New repository variable**

- Name: `GOOGLE_CLIENT_ID`
- Value: the client ID

Then re-run the deploy: **Actions › Deploy to GitHub Pages › Run workflow** (or push to `main`).

For local development, copy `.env.example` to `.env.local` and paste the ID there, then `npm run dev`.

## 3. Use it

On the site, click **Connect Google Sheet** and approve access. The first time, the app creates a sheet called **Bookclub** in your Drive with every tab, header row and dropdown set up. After that it finds the same sheet again.

- Rows you add or change in the sheet show up in the app; the app reads columns by header name, so don't rename the headers.
- **Current words** on the Books tab is a formula that totals the Sessions tab. Don't type over it.
- Google's browser sign-in lasts for the open page, so after a refresh click **Reconnect**. Your data is in the sheet, not the browser.

## Not built yet

- A shared Club sheet for the whole club. Check-ins currently go to the Club tab of each person's own sheet.
- Chapters, Story bible, Milestones and Contributors tabs are created but have no screens yet.
- The AI request/reply handoff from the design doc.
- Publishing the consent screen out of "Testing", which Google requires before people who aren't listed test users can sign in.
