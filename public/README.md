Higher · Lower — Static UI for H-L API

This is a minimal static frontend that consumes the public H-L API at https://beautyglamours-f0ec7.web.app.

Files:
- index.html — main game UI
- styles.css — basic styling
- app.js — client logic

Run locally (simple static server):

Using Node (http-server):

```bash
npx http-server public -c-1
```

Using Python 3:

```bash
cd public
python -m http.server 8080
```

Open http://localhost:8080 and use the "New Round" button to start a game.

Notes:
- The UI uses the demo base URL in `app.js`. Change `BASE_URL` if you host the API elsewhere.
- If you host this UI on a different origin than the API, ensure the API allows CORS from your host.
