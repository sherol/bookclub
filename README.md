# bookclub
Design: [docs/design.md](docs/design.md)
Mock and logo: [design/](design/)

## App

Live at https://sherol.github.io/bookclub/ — it shows sample data until you connect a Google Sheet. Sign-in uses the same Firebase project as SheetSync ([details](docs/google-setup.md)).

```sh
npm install
npm run dev     # http://localhost:5173/bookclub/
npm test
npm run build
```

Every push to `main` builds, tests and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
