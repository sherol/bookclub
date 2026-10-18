# Connecting Google Sheets

Bookclub signs in with Google through **Firebase Auth**, using the same Firebase project and OAuth client as [SheetSync](https://github.com/sherol/sheetsync) (project `gen-lang-client-0263183169`). There is no client ID or secret to set in this repo: the Firebase web config in `src/google/auth.ts` is public and identifies the project.

## What the shared project needs

SheetSync already uses this project from `sherol.github.io`, so these should already be in place. If sign-in fails, check them in this order:

1. **Authorized domain.** [Firebase console](https://console.firebase.google.com/) › the project › **Authentication › Settings › Authorized domains** must list `sherol.github.io`. `localhost` is there by default for `npm run dev`. If it's missing, the app says "This site isn't on the Firebase project's list of authorized domains".
2. **APIs.** In [Google Cloud Console](https://console.cloud.google.com/) for the same project, **APIs & Services › Library**: **Google Sheets API** and **Google Drive API** are enabled.
3. **Scope.** **OAuth consent screen › Data access** includes `https://www.googleapis.com/auth/drive.file`. Bookclub asks only for this scope, so it sees only the sheet it creates, not the rest of anyone's Drive.
4. **Who can sign in.** While the consent screen is in **Testing**, only the accounts under **Audience › Test users** can sign in. Add each club member there, or publish the app.

Because the project is shared, Google's consent window shows that project's app name (the one set for SheetSync). You can change it under **OAuth consent screen › Branding** to something that covers both apps.

## Using it

On the site, click **Connect Google Sheet** and approve access in the Google window. The first time, the app creates a sheet called **Bookclub** in your Drive with every tab, header row and dropdown set up. After that it finds the same sheet again.

- Rows you add or change in the sheet show up in the app. The app reads columns by header name, so don't rename the headers.
- **Current words** on the Books tab is a formula that totals the Sessions tab. Don't type over it.
- Google's access lasts about an hour and for the open page only. When it runs out, or after a refresh, click **Reconnect**. Your data is in the sheet, not the browser.

## Not built yet

- A shared Club sheet for the whole club. Check-ins currently go to the Club tab of each person's own sheet.
- Screens for the Chapters, Story bible, Milestones and Contributors tabs (the tabs are created).
- The AI request/reply handoff from the design doc.
